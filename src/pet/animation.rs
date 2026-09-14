use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "kebab-case")]
pub enum Animation {
    Idle,
    WalkLeft,
    WalkRight,
    Sitting,
    Sleeping,
    Happy,
    Jumping,
    Eating,
    Playing,
}

impl Animation {
    pub fn all() -> &'static [Animation] {
        &[
            Animation::Idle,
            Animation::WalkLeft,
            Animation::WalkRight,
            Animation::Sitting,
            Animation::Sleeping,
            Animation::Happy,
            Animation::Jumping,
            Animation::Eating,
            Animation::Playing,
        ]
    }

    pub fn as_str(&self) -> &'static str {
        match self {
            Animation::Idle => "idle",
            Animation::WalkLeft => "walk-left",
            Animation::WalkRight => "walk-right",
            Animation::Sitting => "sitting",
            Animation::Sleeping => "sleeping",
            Animation::Happy => "happy",
            Animation::Jumping => "jumping",
            Animation::Eating => "eating",
            Animation::Playing => "playing",
        }
    }

    /// Frame count for each animation (matches frontend CAT_FRAMES)
    pub fn frame_count(&self) -> usize {
        match self {
            Animation::Idle => 2,
            Animation::WalkLeft | Animation::WalkRight => 2,
            Animation::Sitting => 1,
            Animation::Sleeping => 2,
            Animation::Happy => 2,
            Animation::Jumping => 1,
            Animation::Eating => 2,
            Animation::Playing => 2,
        }
    }

    /// Base interval ms at 1x speed
    pub fn interval_ms(&self) -> u64 {
        match self {
            Animation::WalkLeft | Animation::WalkRight => 180,
            Animation::Sleeping => 900,
            Animation::Eating => 260,
            Animation::Playing => 160,
            Animation::Idle | Animation::Happy | Animation::Sitting | Animation::Jumping => 520,
        }
    }
}
