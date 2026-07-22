import behavioursData from '../data/criteria/behaviours.json';

type BehaviourLevel = keyof typeof behavioursData.levels;

/**
 * Maps the UI grade string to the exact key in the JSON file
 */
export const mapGradeToLevel = (grade: string): BehaviourLevel | null => {
  if (!grade) return null;
  if (grade.includes("Administrative Assistant") || grade.includes("Administrative Officer")) {
    return "Level 1 (AA/AO)";
  }
  if (grade.includes("Executive Officer")) {
    return "Level 2 (EO)";
  }
  if (grade.includes("Higher Executive Officer") || grade.includes("Senior Executive Officer") || grade.includes("Fast Stream")) {
    return "Level 3 (HEO/SEO)";
  }
  if (grade.includes("Grade 7") || grade.includes("Grade 6")) {
    return "Level 4 (G7/G6)";
  }
  if (grade.includes("Senior Civil Service") || grade === "SCS") {
    return "Level 5 (SCS)";
  }
  return null; // Fallback or Director level
};

/**
 * Returns a formatted markdown string containing the verbatim criteria 
 * for the selected behaviours at the specified grade.
 */
export const getCriteriaContext = (type: 'behaviours', grade: string, selections: string[]): string => {
  if (type !== 'behaviours') return "";
  
  const levelKey = mapGradeToLevel(grade);
  if (!levelKey) return "";
  
  const levelData = behavioursData.levels[levelKey] as Record<string, string[]>;
  if (!levelData) return "";

  let context = `**Context: Civil Service Success Profiles - Behaviours (${levelKey})**\n`;
  context += `The following are the exact criteria the candidate must demonstrate for their grade:\n\n`;

  let foundAny = false;
  
  selections.forEach(selection => {
    if (!selection) return;
    // Exact match or close match
    const match = Object.keys(levelData).find(k => k.toLowerCase() === selection.toLowerCase());
    if (match) {
      foundAny = true;
      context += `* **${match}**:\n`;
      levelData[match].forEach(bullet => {
        context += `  - ${bullet}\n`;
      });
      context += `\n`;
    }
  });

  return foundAny ? context : "";
};
