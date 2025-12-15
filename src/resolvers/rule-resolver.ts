import fs from 'fs';
import path from 'path';
import { AnalyticsType, RuleConfig } from '../types/index.js';

export class RuleResolver {
  private config: RuleConfig;
  private patterns: Map<AnalyticsType, RegExp[]>;

  constructor(configPath: string) {
    // Read and parse config file
    const configContent = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent) as RuleConfig;

    // Compile regex patterns
    this.patterns = this.compilePatterns();
  }

  /**
   * Compile keyword patterns into RegExp objects
   * @returns Map of analytics type to regex patterns
   */
  private compilePatterns(): Map<AnalyticsType, RegExp[]> {
    const compiled = new Map<AnalyticsType, RegExp[]>();

    Object.entries(this.config.keywordPatterns).forEach(([type, patterns]) => {
      const regexPatterns = patterns.map(
        (pattern) => new RegExp(pattern, 'i') // case-insensitive
      );
      compiled.set(type as AnalyticsType, regexPatterns);
    });

    return compiled;
  }

  /**
   * Resolve analytics type from task title
   * Returns the type whose keyword appears FIRST in the title (left-to-right)
   * @param title - Task title to analyze
   * @returns Analytics type
   */
  resolve(title: string): AnalyticsType {
    let earliestMatch: { type: AnalyticsType; position: number } | null = null;

    // Check all types and find which keyword appears first in the title
    for (const type of this.config.priorityOrder) {
      const patterns = this.patterns.get(type);

      if (!patterns) continue;

      // Find earliest match position for this type
      for (const pattern of patterns) {
        const match = title.match(pattern);

        if (match && match.index !== undefined) {
          // Found a match - check if it's earlier than previous matches
          if (!earliestMatch || match.index < earliestMatch.position) {
            earliestMatch = { type, position: match.index };
          }
        }
      }
    }

    // Return the type with earliest match, or default if no match
    return earliestMatch ? earliestMatch.type : this.config.defaultType;
  }

  /**
   * Get rule file path for analytics type
   * @param type - Analytics type
   * @returns Absolute path to rule file
   */
  getRuleFilePath(type: AnalyticsType): string {
    const relativePath = this.config.ruleFiles[type];

    if (!relativePath) {
      throw new Error(`No rule file configured for type: ${type}`);
    }

    // Return absolute path (assumes rule files are in project root)
    return path.resolve(process.cwd(), relativePath);
  }

  /**
   * Get all configured analytics types
   * @returns Array of analytics types
   */
  getTypes(): AnalyticsType[] {
    return this.config.priorityOrder;
  }

  /**
   * Get default analytics type
   * @returns Default type
   */
  getDefaultType(): AnalyticsType {
    return this.config.defaultType;
  }
}
