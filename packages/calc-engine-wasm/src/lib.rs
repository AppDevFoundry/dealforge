//! WASM bindings for the DealForge calculation engine
//!
//! This crate provides JavaScript-friendly wrappers around the
//! pure Rust calculation functions in `calc-engine`.

use wasm_bindgen::prelude::*;

/// Initialize the WASM module (called automatically)
#[wasm_bindgen(start)]
pub fn init() {
    // Set up panic hook for better error messages in browser console
    #[cfg(feature = "console_error_panic_hook")]
    console_error_panic_hook::set_once();
}

/// Placeholder calculation function
///
/// Replace this with actual calculation bindings as they are implemented
/// in the calc-engine crate.
#[wasm_bindgen]
pub fn calculate_rental(_inputs_json: &str) -> Result<String, JsValue> {
    // TODO: Implement actual rental calculation
    // let inputs: RentalInputs = serde_json::from_str(inputs_json)
    //     .map_err(|e| JsValue::from_str(&e.to_string()))?;
    // let results = inputs.calculate();
    // serde_json::to_string(&results)
    //     .map_err(|e| JsValue::from_str(&e.to_string()))

    Ok(r#"{"message": "WASM calculation engine placeholder"}"#.to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_placeholder() {
        let result = calculate_rental("{}").unwrap();
        assert!(result.contains("placeholder"));
    }
}
