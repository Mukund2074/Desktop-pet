use super::animation::Animation;
use rand::Rng;

/// Lightweight behavior model — the actual movement is executed in the
/// frontend (JS) by moving the Tauri window. This module documents the
/// behavior and provides a deterministic picker for the Rust side if needed
/// (e.g., future system-tray-triggered actions or tests).

#[derive(Debug, Clone, Copy)]
pub enum Behavior {
    Idle,
    Walk,
    Sit,
    Sleep,
    Happy,
    Jump,
    Eat,
    Play,
}

impl Behavior {
    pub fn to_animation(self, walk_left: bool) -> Animation {
        match self {
            Behavior::Idle => Animation::Idle,
            Behavior::Walk => {
                if walk_left {
                    Animation::WalkLeft
                } else {
                    Animation::WalkRight
                }
            }
            Behavior::Sit => Animation::Sitting,
            Behavior::Sleep => Animation::Sleeping,
            Behavior::Happy => Animation::Happy,
            Behavior::Jump => Animation::Jumping,
            Behavior::Eat => Animation::Eating,
            Behavior::Play => Animation::Playing,
        }
    }
}

/// Pick next behavior using walk frequency bias.
/// walk_freq in 0.0..1.0 — higher means more walking.
pub fn pick_next(walk_freq: f64) -> Behavior {
    let mut rng = rand::rng();
    let roll: f64 = rng.random();
    if roll < 0.12 {
        Behavior::Sit
    } else if roll < 0.18 {
        Behavior::Sleep
    } else if roll < 0.22 {
        Behavior::Happy
    } else if roll < walk_freq + 0.15 {
        Behavior::Walk
    } else {
        Behavior::Idle
    }
}

#[cfg(test)]
mod tests {
    use super::*;
    #[test]
    fn pick_is_valid() {
        let b = pick_next(0.5);
        let _ = b.to_animation(true);
    }
}
