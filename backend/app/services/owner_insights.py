"""Owner dashboard category labels and message templates."""

from __future__ import annotations

CATEGORY_LABEL_MAP: dict[str, str] = {
    "book_club": "독서",
    "운동": "운동",
    "자기계발": "스터디",
    "동네친구": "동네친구",
    "아웃도어/여행": "아웃도어",
    "가족·육아": "가족·육아",
    "취미": "취미",
    "음식": "음식",
}

RECOMMENDED_ACTIONS: dict[str, dict[str, str]] = {
    "독서": {
        "type": "owner_message",
        "label": "독서모임 환영 메시지 작성하기",
        "template": "독서모임 환영합니다! 조용한 자리와 콘센트를 마련해두었습니다.",
    },
    "운동": {
        "type": "owner_message",
        "label": "러닝크루 환영 메시지 작성하기",
        "template": "단체 모임 환영! 12인 이상 단체석 사전 예약 가능합니다.",
    },
    "스터디": {
        "type": "owner_message",
        "label": "스터디 모임 환영 메시지 작성하기",
        "template": "스터디 모임 환영합니다! 넓은 테이블과 콘센트, 와이파이 완비되어 있어요.",
    },
    "자기계발": {
        "type": "owner_message",
        "label": "자기계발 모임 환영 메시지 작성하기",
        "template": "자기계발 모임 환영합니다! 조용히 집중할 수 있는 공간을 준비했습니다.",
    },
    "취미": {
        "type": "owner_message",
        "label": "취미 모임 환영 메시지 작성하기",
        "template": "취미 모임 환영합니다! 편하게 모일 수 있는 공간을 마련해두었어요.",
    },
    "음식": {
        "type": "owner_message",
        "label": "음식 모임 환영 메시지 작성하기",
        "template": "음식 모임 환영합니다! 단체 예약 시 메뉴 구성을 미리 상담해 드려요.",
    },
}

DEFAULT_RECOMMENDED_ACTION: dict[str, str] = {
    "type": "owner_message",
    "label": "모임 환영 메시지 작성하기",
    "template": "모임 환영합니다! 편하게 이용하실 수 있도록 준비해 두었습니다.",
}


def category_display_label(raw_category: str) -> str:
    return CATEGORY_LABEL_MAP.get(raw_category, raw_category)


OWNER_RECOMMENDATION_CATEGORIES: frozenset[str] = frozenset(
    {"독서", "스터디", "운동", "자기계발", "취미", "음식"},
)


def meeting_category_match_labels(raw_category: str) -> set[str]:
    labels = {raw_category}
    mapped = category_display_label(raw_category)
    labels.add(mapped)
    return labels


def recommended_action_for_category(display_category: str) -> dict[str, str]:
    action = RECOMMENDED_ACTIONS.get(display_category)
    if action is not None:
        return dict(action)
    return dict(DEFAULT_RECOMMENDED_ACTION)
