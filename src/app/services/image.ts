import { Injectable, inject } from '@angular/core';
import { SupabaseService } from './supabase-service';
import { AuthService } from './auth';

const EXTENSIONS: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
};

@Injectable({ providedIn: 'root' })
export class ImageService {
  private readonly supabase = inject(SupabaseService).supabaseClient;
  private readonly auth = inject(AuthService);
  private readonly bucket = 'listing-images';

  readonly placeholder = 'data/images/no-photo.png';
  readonly maxBytes = 5 * 1024 * 1024;

  validate(file: File): string | null {
    if (!EXTENSIONS[file.type]) return 'Use a JPEG, PNG or WebP image.';
    if (file.size > this.maxBytes) return 'The image must be 5 MB or smaller.';
    return null;
  }

  async upload(file: File): Promise<string> {
    const userId = await this.auth.getUserId();
    if (!userId) throw new Error('Not logged in');

    const name = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const path = `${userId}/${name}.${EXTENSIONS[file.type]}`;

    const { error } = await this.supabase.storage
      .from(this.bucket)
      .upload(path, file, { contentType: file.type, cacheControl: '31536000' });
    if (error) throw error;
    return path;
  }

  async remove(path: string | undefined | null): Promise<void> {
    if (!path || !this.isStored(path)) return;
    await this.supabase.storage.from(this.bucket).remove([path]);
  }

  urlFor(imageUrl: string | undefined | null): string {
    if (!imageUrl) return this.placeholder;
    if (!this.isStored(imageUrl)) return imageUrl;
    return this.supabase.storage.from(this.bucket).getPublicUrl(imageUrl).data.publicUrl;
  }

  private isStored(value: string): boolean {
    return !/^(https?:|images\/|data\/)/.test(value);
  }

  async removeAllMine(): Promise<void> {
    const userId = await this.auth.getUserId();
    if (!userId) return;

    const { data, error } = await this.supabase.storage
      .from(this.bucket)
      .list(userId, { limit: 1000 });
    if (error) throw error;

    const paths = (data ?? []).map((file) => `${userId}/${file.name}`);
    if (paths.length === 0) return;

    const { error: removeError } = await this.supabase.storage.from(this.bucket).remove(paths);
    if (removeError) throw removeError;
  }
}
