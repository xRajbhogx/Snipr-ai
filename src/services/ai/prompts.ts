export const buildExplainPrompt = (
    code: string,
    language: string
    ) => `
    Explain this ${language} code.

    Return:

    1. Purpose
    2. How it works
    3. Key concepts

    Code:
    ${code}
    `;

export const buildImprovePrompt = (
    code: string,
    language: string
    ) => `
    Analyze this ${language} code.

    Suggest:

    - Performance improvements
    - Readability improvements
    - Best practices

    Code:
    ${code}
    `;