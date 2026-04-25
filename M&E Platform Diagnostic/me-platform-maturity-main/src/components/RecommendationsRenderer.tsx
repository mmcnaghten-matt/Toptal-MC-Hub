/**
 * Shared component for rendering AI-generated strategic recommendations.
 * Handles parsing the markdown output, skipping intro text, and proper bold formatting.
 */

interface RecommendationsRendererProps {
  text: string;
}

const RecommendationsRenderer = ({ text }: RecommendationsRendererProps) => {
  // Split on "**Recommendation N:" pattern
  const parts = text.split(/\*\*Recommendation\s+\d+[:/]\s*/i);

  // Filter out empty parts and the intro paragraph (first part before any recommendation)
  const intro = parts[0]?.trim();
  const recommendations = parts.slice(1).filter(s => s.trim());

  // If the split didn't produce recommendations, try rendering the whole text as-is
  if (recommendations.length === 0) {
    return (
      <div className="text-sm text-foreground leading-relaxed whitespace-pre-line">
        {text}
      </div>
    );
  }

  return (
    <div>
      {/* Render intro paragraph without a number badge, if present */}
      {intro && (
        <p className="text-sm text-muted-foreground mb-4">{intro}</p>
      )}

      {recommendations.map((section, idx) => {
        // Each section starts with the title (before the first \n) then body
        // The title portion ends with "**" (closing bold from the split)
        const titleEndIdx = section.indexOf("**");
        let title = "";
        let body = section;

        if (titleEndIdx !== -1) {
          title = section.substring(0, titleEndIdx).trim();
          body = section.substring(titleEndIdx + 2).trim();
        }

        // Format the body: make subsection headers bold (Rationale:, Strategic Action:, Expected Impact:, etc.)
        const formattedBody = body
          // First strip any remaining markdown bold markers
          .replace(/\*\*([^*]+)\*\*/g, '$1')
          // Then apply bold to known subsection keywords followed by colon
          .replace(/(Rationale|Strategic Action|Expected Impact|Key Actions?|Implementation|Next Steps?|Impact|Current State|Recommendation|Priority|Timeline|Benefits?|Goal|Objective|Focus Area|Why It Matters|What To Do|How To Start)[:\s]*[-–]?\s*/gi,
            '<strong>$1:</strong> ')
          .replace(/\n/g, '<br/>');

        return (
          <div key={idx} className="bg-secondary/50 rounded-lg p-5 mb-4 last:mb-0">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-bold text-primary">{idx + 1}</span>
              </div>
              <div className="flex-1">
                {title && (
                  <h4 className="text-sm font-bold text-foreground mb-2">{title}</h4>
                )}
                <div
                  className="text-sm text-foreground leading-relaxed prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: formattedBody }}
                />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default RecommendationsRenderer;
