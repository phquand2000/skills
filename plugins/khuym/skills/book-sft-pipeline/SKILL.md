---
name: book-sft-pipeline
description: Use when the user asks to fine-tune on books, create an SFT dataset from books, train a style-transfer or author-voice model, extract ePub text, segment long-form book content, or prepare literary data for LoRA or small-model training.
metadata:
  dependencies: []
---

# Book SFT Pipeline

Convert long-form books into supervised fine-tuning data for literary style
transfer. Keep the entrypoint lightweight: use this file to route the work, then
open only the references needed for the current phase.

## Activate When

- Building fine-tuning datasets from literary works
- Creating author-voice or style-transfer models
- Preparing training data for Tinker or similar SFT platforms
- Designing text segmentation pipelines for long-form content
- Training small models on limited literary data

## Fast Path

1. Confirm the source is suitable: prefer ePub over PDF, remove front/back
   matter, and preserve paragraph breaks.
2. Segment into coherent 150-400 word chunks. Never break mid-sentence.
3. Generate synthetic scene descriptions without quoting the source text.
4. Build JSONL conversation examples with varied system prompts and user
   templates.
5. Train a LoRA on a base model, not an instruction-tuned model.
6. Validate on modern scenarios and grep training data for suspicious phrases.

## Default Parameters

| Setting | Default |
|---------|---------|
| Chunk size | 150-400 words |
| Prompt diversity | 15+ templates, 5+ system prompts |
| Variants | 2 per chunk |
| Model | Qwen/Qwen3-8B-Base or another base 8B-class model |
| LoRA rank | 32 |
| Epochs | 3 |
| Test set | 50 examples minimum |

## Core Rules

1. Source ePub before PDF because OCR noise becomes learned behavior.
2. Keep chunks semantically complete and paragraph-bounded where possible.
3. Teach style, not plot: instructions should describe scenes without quoting.
4. Rotate prompt and system templates to reduce memorization.
5. Use base models for malleable style transfer.
6. Validate originality before claiming the model learned the author's voice.

## Progressive Disclosure

Open these only when the task reaches that layer:

- [Pipeline Workflow](./references/pipeline-workflow.md) - full phase-by-phase
  workflow with extraction, segmentation, instruction generation, dataset
  construction, training, validation commands, costs, and troubleshooting.
- [Segmentation Strategies](./references/segmentation-strategies.md) - advanced
  paragraph, scene, dialogue, and LLM-assisted chunking patterns.
- [Tinker Format Specification](./references/tinker-format.md) - Datum,
  renderer, token-weight, JSONL, and training loop details.
- [Tinker API Documentation](./references/tinker.txt) - full API reference.
- [Gertrude Stein Case Study](./examples/gertrude-stein/case-study.md) -
  complete working example with outputs and configuration.

## Implementation Starter

Use the sample script when the user wants executable scaffolding:

```bash
python plugins/khuym/skills/book-sft-pipeline/scripts/pipeline_example.py
```

The script demonstrates the same pipeline semantics as this skill:
segmentation, diverse prompt construction, Tinker datum construction, and
originality checks.

## Validation Checklist

- Chunks end at natural grammatical boundaries.
- JSONL rows contain system, user, and assistant messages.
- Prompt variants are distributed across chunks.
- Held-out test examples are excluded from training.
- Modern scenario outputs contain style markers without original plot content.
- Exact output phrases do not appear in the training JSONL.

## References

Internal references:
- [Pipeline Workflow](./references/pipeline-workflow.md)
- [Segmentation Strategies](./references/segmentation-strategies.md)
- [Tinker Format Specification](./references/tinker-format.md)
- [Tinker API Documentation](./references/tinker.txt)

External resources:
- [Research Paper](https://arxiv.org/pdf/2510.13939)
- [Dataset on Hugging Face](https://huggingface.co/datasets/MuratcanKoylan/gertrude-stein-style-sft)
- [Gertrude Stein Case Study](./examples/gertrude-stein/case-study.md)

## Skill Metadata

**Created**: 2025-12-26
**Last Updated**: 2025-12-28
**Author**: Muratcan Koylan
**Version**: 2.0.0
**Standalone**: Yes
