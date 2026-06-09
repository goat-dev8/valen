use crate::errors::EngineError;

/// Off-chain and on-chain engines share this evaluation boundary.
pub trait Engine {
    type Input;
    type Output;

    fn evaluate(&self, input: Self::Input) -> Result<Self::Output, EngineError>;
}
