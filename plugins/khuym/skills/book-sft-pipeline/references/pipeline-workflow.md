# Book SFT Pipeline Workflow

This reference preserves the detailed workflow behind the lightweight
`SKILL.md` entrypoint. Load it when the user needs implementation details,
commands, examples, or troubleshooting.

## Pipeline Architecture

Use an orchestrated pipeline with resumable phase outputs:

1. Extraction: ePub to cleaned paragraph text
2. Segmentation: cleaned text to 150-400 word chunks
3. Instruction generation: chunks to synthetic scene descriptions
4. Dataset builder: descriptions plus chunks to JSONL messages
5. Training: JSONL to LoRA adapter
6. Validation: modern prompts, originality checks, and detector checks

## Phase 1: Text Extraction

Critical rules:

1. Always source ePub over PDF because OCR errors become learned patterns.
2. Use paragraph-level extraction from `<p>` tags to preserve breaks.
3. Remove front matter, back matter, copyright, and table of contents text.

```python
from epub2 import EPub
from bs4 import BeautifulSoup


def extract_epub(path):
    book = EPub(path)
    chapters = []
    for item in book.flow:
        html = book.get_chapter(item.id)
        soup = BeautifulSoup(html, "html.parser")
        paragraphs = [p.get_text().strip() for p in soup.find_all("p")]
        chapters.append("\n\n".join(p for p in paragraphs if p))
    return "\n\n".join(chapters)
```

## Phase 2: Intelligent Segmentation

Smaller chunks produce more training examples and better style transfer than
larger chunks. Use 150-400 words, keep natural paragraph boundaries, and carry
the last paragraph forward as overlap when useful.

```python
def segment(text, min_words=150, max_words=400):
    paragraphs = text.split("\n\n")
    chunks, buffer, buffer_words = [], [], 0

    for para in paragraphs:
        words = len(para.split())
        if buffer_words + words > max_words and buffer_words >= min_words:
            chunks.append("\n\n".join(buffer))
            buffer = [buffer[-1], para] if buffer else [para]
            buffer_words = sum(len(p.split()) for p in buffer)
        else:
            buffer.append(para)
            buffer_words += words

    if buffer:
        chunks.append("\n\n".join(buffer))
    return chunks
```

Expected results for an 86,000-word book:

| Method | Chunks | Training examples |
|--------|--------|-------------------|
| 250-650 words | About 150 | About 300 with 2 variants |
| 150-400 words plus overlap | About 300 | 600+ with 2 variants |

## Phase 3: Diverse Instruction Generation

Using a single prompt template causes memorization. Diverse templates teach the
underlying style.

```python
SYSTEM_PROMPTS = [
    "You are an expert creative writer capable of emulating specific literary styles.",
    "You are a literary writer with deep knowledge of classic prose styles.",
    "You are a creative writer skilled at emulating distinctive authorial voices.",
    "You write prose that captures the essence of modernist literature.",
    "You are a talented writer who can channel classic American authors.",
]

PROMPT_TEMPLATES = [
    "Write a passage in the style of {author}: {desc}",
    "Channel {author}'s voice to write about: {desc}",
    "In {author}'s distinctive prose style, describe: {desc}",
    "Write this scene as {author} would have: {desc}",
    "Using {author}'s repetitive technique, describe: {desc}",
    "Capture the rhythm of {author} in this passage: {desc}",
    "Write like {author}: {desc}",
    "In the voice of {author}, write: {desc}",
    "This is a literary exercise. Write like {author}: {desc}",
    "Can you write in {author}'s style? {desc}",
]
```

Use a cheap, fast LLM to summarize what happens in each excerpt:

```python
INSTRUCTION_PROMPT = """Describe what is happening in this excerpt in 2-3 sentences.
Focus on: characters present, actions, emotions, setting.
Do NOT quote the text directly.

Excerpt:
{text}
"""

instruction = llm_call(INSTRUCTION_PROMPT.format(text=chunk))
```

## Phase 4: Dataset Construction

Each JSONL row should contain the system prompt, user instruction, and assistant
completion.

```json
{
  "messages": [
    {"role": "system", "content": "You are an expert creative writer..."},
    {"role": "user", "content": "Write in the style of Author: Scene description..."},
    {"role": "assistant", "content": "The actual book text from chunk..."}
  ]
}
```

Generate multiple variants per chunk:

```python
def build_examples(chunk, instruction, author, variants=2):
    examples = []
    for i in range(variants):
        system = SYSTEM_PROMPTS[i % len(SYSTEM_PROMPTS)]
        template = PROMPT_TEMPLATES[(chunk.id + i) % len(PROMPT_TEMPLATES)]
        user = template.format(author=author, desc=instruction)
        examples.append({"messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
            {"role": "assistant", "content": chunk.text},
        ]})
    return examples
```

## Phase 5: LoRA Training on Tinker

Use a base model, not an instruction-tuned model. Base models are more
malleable for low-level style patterns.

```python
CONFIG = {
    "model_name": "Qwen/Qwen3-8B-Base",
    "lora_rank": 32,
    "learning_rate": 5e-4,
    "batch_size": 4,
    "epochs": 3,
}
```

```python
import tinker
from tinker import types

training_client = await service_client.create_lora_training_client_async(
    base_model="Qwen/Qwen3-8B-Base",
    rank=32,
)

for epoch in range(3):
    for batch in batches:
        await training_client.forward_backward_async(batch, loss_fn="cross_entropy")
        await training_client.optim_step_async(types.AdamParams(learning_rate=5e-4))

result = await training_client.save_weights_for_sampler_async(name="final")
```

## Phase 6: Validation

Test with scenarios that could not exist in the source book:

```python
TEST_PROMPTS = [
    "Write about a barista making lattes",
    "Describe lovers communicating through text messages",
    "Write about someone anxious about climate change",
]
```

If the model applies style markers to modern scenarios, it learned style rather
than source-book content.

Search training data for output phrases:

```bash
grep "specific phrase from output" dataset.jsonl
```

Expected result: no matches.

Optionally test outputs with GPTZero, Pangram, or ZeroGPT.

## Known Issues and Solutions

| Symptom | Cause | Solution |
|---------|-------|----------|
| Original character names leak | One book has limited name diversity | Train on multiple books or add synthetic examples |
| Exact phrases appear | Too few prompt variants or too many epochs | Use 15+ templates and limit to 3 epochs |
| Fragmented outputs | Segmentation breaks mid-thought | Break at paragraph and sentence boundaries |

## Expected Results

| Metric | Value |
|--------|-------|
| Training examples | 500-1000 per book |
| Model | Qwen/Qwen3-8B-Base |
| LoRA rank | 32 |
| Adapter size | About 350 MB |
| Training time | About 15 min |
| Loss reduction | 90%+ |
| Style transfer success | About 50% perfect |

## Cost Estimate

| Component | Cost |
|-----------|------|
| LLM instruction generation | About $0.50 |
| Tinker training, 15 min | About $1.50 |
| Total | About $2.00 |

## Context Engineering Mapping

- Project development: staged, idempotent pipeline phases with intermediate
  artifacts for debugging.
- Context compression: coherent chunks preserve dense stylistic signal.
- Multi-agent patterns: an orchestrator can isolate extraction, segmentation,
  instruction generation, building, training, and validation contexts.
- Evaluation: combine functional style checks, originality checks, and external
  detectors.
- Context fundamentals: prompt diversity prevents attention collapse on a
  single instruction pattern.
