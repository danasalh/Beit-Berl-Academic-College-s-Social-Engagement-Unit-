import React, { useState } from "react";
import "./TermsDoc.css";

const TermsDoc = () => {
  const [answers, setAnswers] = useState([false, false, false, false, false]);

  const handleToggle = (index) => {
    // שאלה נעולה אם לא סומנו הקודמות
    if (index === 0 || answers[index - 1]) {
      const updated = [...answers];
      updated[index] = !updated[index];
      setAnswers(updated);
    }
  };

  const mainQuestions = [
    "האם אתה סטודנט לתואר ראשון בחינוך (B.Ed)?",
    "האם קיבלת במהלך התואר 2 נק\"ז או יותר במסגרת מעורבות חברתית, מילואים וכדומה..?",
    "האם עומדים לרשותך קורסי בחירה שטרם למדת בגינם ניתן להמיר את נקודות הזכות?"
  ];

  const extraQuestions = [
    "אני מאשר שכל מה שסימנתי נכון",
    "אני מסכים לתנאי השימוש"
  ];

  const allChecked = answers.every(Boolean);
  const mainChecked = answers[0] && answers[1] && answers[2];

  return (
    <div className="termsdoc-overlay">
      <div className="termsdoc-box">
        <h2 className="termsdoc-title">טופס הסכמה לתנאים/בקשת אישור</h2>

        <div className="termsdoc-questions">
          {mainQuestions.map((q, index) => (
            <div key={index} className="termsdoc-question">
              <button
                className={`circle-button ${answers[index] ? "checked" : ""}`}
                onClick={() => handleToggle(index)}
              >
                {answers[index] && <span className="checkmark">✔</span>}
              </button>
              <span className="question-text">{q}</span>
            </div>
          ))}

          {extraQuestions.map((q, i) => {
            const index = i + 3;
            const isActive = mainChecked;
            return (
              <div
                key={index}
                className={`termsdoc-question small ${isActive ? "active" : ""}`}
              >
                <button
                  className={`circle-button ${answers[index] ? "checked" : ""}`}
                  onClick={() => isActive && handleToggle(index)}
                  disabled={!isActive}
                >
                  {answers[index] && <span className="checkmark">✔</span>}
                </button>
                <span className="question-text small">{q}</span>
              </div>
            );
          })}
        </div>

        <button className="approve-button" disabled={!allChecked}>
          אישור
        </button>
      </div>
    </div>
  );
};

export default TermsDoc;
