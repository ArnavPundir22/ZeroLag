# AI Magic Import Flow

The AI Magic Import feature allows users to upload a raw image of a timetable/schedule and instantly convert it into a fully interactive Kanban board.

---

## 1. Technical Implementation

The feature relies on Google's GenAI Vision API (`gemini-2.5-flash`). It is designed to run completely locally in the browser, passing the Base64 image data directly to Google's API, rather than routing through a middle-tier backend.

```mermaid
sequenceDiagram
    participant User
    participant UI as SettingsModal
    participant Parser as aiTimetableParser
    participant Google as Gemini Vision API
    participant Engine as importTimetable

    User->>UI: Uploads Timetable Image
    UI->>UI: Show Loading State
    UI->>Parser: pass File & API Key
    
    Parser->>Parser: Convert File to Base64 String
    Parser->>Google: POST /generateContent (Image + Strict JSON Prompt)
    
    Google-->>Parser: Returns JSON String
    
    alt Valid JSON
        Parser->>Parser: JSON.parse()
        Parser-->>UI: Return parsed data array
        UI->>Engine: importDynamicTimetable(data)
        Engine->>Engine: Generate Board, Columns, Tasks via RxDB
        UI->>User: Close modal, show new board!
    else Invalid JSON / API Error
        Parser-->>UI: Throws Error (e.g. 429 Quota Exceeded)
        UI->>User: Displays Alert
    end
```

---

## 2. The Strict JSON Prompting Strategy
To ensure the vision model does not hallucinate markdown wrappers or conversational text, we pass `config: { responseMimeType: "application/json" }` directly into the `generateContent` configuration.

This enforces the engine to return structurally valid JSON, preventing `SyntaxError: Expected ',' or '}'` exceptions during parsing.

### Fallback Sanitization
Even with the mime-type configuration, we run a fallback regex to strip out any potential markdown backticks that the model might accidentally include in edge cases:

```typescript
const cleanText = text.replace(/```json/gi, '').replace(/```/g, '').trim();
return JSON.parse(cleanText);
```
