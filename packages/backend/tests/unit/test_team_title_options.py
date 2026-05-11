"""Contract: TitlePair Literal and TITLE_OPTIONS dict must list the same keys.

If they drift, the route accepts a `title_key` that `apply_review_update`
then KeyErrors on, or vice versa — both are silent in normal type-checking
because the dict's annotation is `dict[str, ...]` not parameterized over the
Literal."""

from typing import get_args

from app.modules.team.schemas import TITLE_OPTIONS, TitlePair


def test_title_options_keys_match_title_pair_literal() -> None:
    literal_values = set(get_args(TitlePair))
    dict_keys = set(TITLE_OPTIONS.keys())
    assert literal_values == dict_keys, (
        f"TitlePair Literal {literal_values} and TITLE_OPTIONS keys "
        f"{dict_keys} disagree — update the matching side."
    )


def test_title_options_values_are_fr_en_pairs() -> None:
    for key, value in TITLE_OPTIONS.items():
        assert isinstance(value, tuple) and len(value) == 2, (
            f"TITLE_OPTIONS[{key!r}] must be a (fr_label, en_label) tuple"
        )
        fr, en = value
        assert fr and en, f"TITLE_OPTIONS[{key!r}] has an empty label"
