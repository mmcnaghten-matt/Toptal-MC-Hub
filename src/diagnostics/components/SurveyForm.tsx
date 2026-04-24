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

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
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

      {/* Questions grouped by dimension */}
      {questionsByDimension.map(({ dimension, questions: qs }) => (
        <div key={dimension.id} className="space-y-5">
          <h3 className="font-semibold text-foreground border-b border-border pb-2">
            {dimension.label}
          </h3>
          {qs.map((q, idx) => (
            <div key={q.id} className="space-y-3">
              <p className="text-sm text-foreground">
                <span className="text-muted-foreground mr-2 text-xs font-mono">
                  {(questions.indexOf(q) + 1).toString().padStart(2, '0')}
                </span>
                {q.text}
              </p>
              <div className="space-y-1">
                <div className="flex gap-2">
                  {Array.from({ length: q.scale }, (_, i) => i + 1).map(val => (
                    <button
                      key={val}
                      type="button"
                      onClick={() => setAnswers(prev => ({ ...prev, [q.id]: val }))}
                      className={`flex-1 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        answers[q.id] === val
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-card text-foreground border-border hover:border-primary/50'
                      }`}
                    >
                      {val}
                    </button>
                  ))}
                </div>
                <div className="flex justify-between text-xs text-muted-foreground px-0.5">
                  <span>{q.anchorLow}</span>
                  <span>{q.anchorHigh}</span>
                </div>
              </div>
            </div>
          ))}
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
