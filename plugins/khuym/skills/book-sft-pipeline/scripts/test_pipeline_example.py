import importlib.util
from pathlib import Path


def load_pipeline_example():
    script_path = Path(__file__).resolve().parents[1] / "scripts" / "pipeline_example.py"
    spec = importlib.util.spec_from_file_location("pipeline_example", script_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def test_segment_text_preserves_paragraph_boundaries():
    pipeline = load_pipeline_example()
    paragraphs = [
        "alpha " * 80,
        "beta " * 80,
        "gamma " * 80,
        "delta " * 80,
    ]

    chunks = pipeline.segment_text("\n\n".join(paragraphs), min_words=100, max_words=180)

    assert [chunk.id for chunk in chunks] == list(range(len(chunks)))
    assert all("\n\n" in chunk.text for chunk in chunks)
    assert all(chunk.word_count >= 80 for chunk in chunks)


def test_build_examples_rotates_prompt_variants():
    pipeline = load_pipeline_example()
    chunk = pipeline.Chunk(text="Example prose.", word_count=2, id=1)

    examples = pipeline.build_examples(chunk, "a quiet room", "Author", variants=3)

    assert len(examples) == 3
    assert {example.assistant for example in examples} == {"Example prose."}
    assert len({example.user for example in examples}) == 3
