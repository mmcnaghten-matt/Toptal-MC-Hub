import { useState } from "react";
import type { QuestionConfig, DimensionConfig } from "../types";

interface Props {
  questions: QuestionConfig[];
  dimensions: DimensionConfig[];
  onSubmit: (answers: Record<string, number>) => void;
  isSubmitting?: boolean;
}

export default function SurveyForm({ questions, dimensions, onSubmit, isSubmitting }: Props) {
  const [answers, setAnswers] = useState<Record<string, number>>({});

  const answered = Object.keys(answers).length;
  const progress = Math.round((answered / questions.length) * 100);
  const allAnswered = answered === questions.length;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!allAnswered) return;
    onSubmit(answers);
  };

  const questionsByDimension = dimensions.map(dim => ({
    dimension: dim,
    questions: questions.filter(q => q.dimension === dim.id),
  }));

  let questionNumber = 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-10">
      {/* Progress */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{answered} of {questions.length} answered</span>
          <span>{progress}%</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Questions grouped by pillar */}
      {questionsByDimension.map(({ dimension, questions: qs }) => (
        <div key={dimension.id} className="space-y-6">
          <div className="border-b border-border pb-2">
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              {dimension.shortName}
            </p>
            <h3 className="font-semibold text-foreground">{dimension.label}</h3>
          </div>

          {qs.map((q) => {
            questionNumber += 1;
            const num = questionNumber;
            return (
              <div key={q.id} className="space-y-3">
                <p className="text-sm text-foreground font-medium">
                  <span className="text-muted-foreground mr-2 text-xs font-mono tabular-nums">
                    {num.toString().padStart(2, '0')}
                  </span>
                  {q.text}
                </p>
                <div className="space-y-2">
                  {q.options.map((option, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: idx }))}
                      className={`w-full text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                        answers[q.id] === idx
                          ? 'bg-primary/10 border-primary text-foreground font-medium'
                          : 'bg-card text-muted-foreground border-border hover:border-primary/40 hover:text-foreground'
                      }`}
                    >
                      <span className={`inline-block w-5 h-5 rounded-full border mr-3 text-xs font-bold text-center leading-5 shrink-0 ${
                        answers[q.id] === idx
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'border-border'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      ))}

      <button
        type="submit"
        disabled={!allAnswered || isSubmitting}
        className="w-full py-3 rounded-lg bg-primary text-primary-foreground font-medium hover:opacity-90 transition-opacity disabled:opacity-40"
      >
        {isSubmitting ? 'Generating your report…' : 'Submit & Get My Report'}
      </button>
    </form>
  );
}
