import fs from 'fs';
import { AnalyticsType, FolderConfig } from '../types/index.js';

export class FolderMapper {
  private config: FolderConfig;

  constructor(configPath: string) {
    // Read and parse config file
    const configContent = fs.readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent) as FolderConfig;
  }

  /**
   * Get BrowserStack folder ID for analytics type
   * @param type - Analytics type
   * @returns Folder ID (hardcoded from BrowserStack)
   */
  getFolderId(type: AnalyticsType): number {
    const folderId = this.config.folderMapping[type];

    if (!folderId) {
      throw new Error(`No folder ID configured for type: ${type}`);
    }

    return folderId;
  }

  /**
   * Get folder display name for analytics type
   * @param type - Analytics type
   * @returns Folder name
   */
  getFolderName(type: AnalyticsType): string {
    const folderName = this.config.folderNames[type];

    if (!folderName) {
      throw new Error(`No folder name configured for type: ${type}`);
    }

    return folderName;
  }

  /**
   * Get all configured folder mappings
   * @returns Map of type to folder ID
   */
  getAllMappings(): Record<AnalyticsType, number> {
    return { ...this.config.folderMapping };
  }

  /**
   * Check if a folder ID exists in config
   * @param folderId - Folder ID to check
   * @returns True if configured
   */
  hasFolderId(folderId: number): boolean {
    return Object.values(this.config.folderMapping).includes(folderId);
  }

  /**
   * Get analytics type by folder ID (reverse lookup)
   * @param folderId - Folder ID
   * @returns Analytics type or null if not found
   */
  getTypeByFolderId(folderId: number): AnalyticsType | null {
    const entry = Object.entries(this.config.folderMapping).find(
      ([, id]) => id === folderId
    );

    return entry ? (entry[0] as AnalyticsType) : null;
  }
}
