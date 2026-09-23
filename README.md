# Gradient

Gradient is a React, Vite, and Tailwind CSS schedule dashboard. With Supabase configured, email accounts authenticate users and day records sync across devices; localStorage remains available for local preview.

The dashboard supports manual blocks, plain-text schedule import with review/edit controls, automatic activity classification, overnight times, browser voice input where available, completion tracking, streaks, evening check-ins, and rule-based suggestions.

## Setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the development server:

   ```bash
   npm run dev
   ```

For a production build, run `npm run build`.

## Enable cross-device login and sync

1. Create a project at [supabase.com](https://supabase.com).
2. Copy `.env.example` to `.env.local`:

   ```powershell
   Copy-Item .env.example .env.local
   ```

3. In Supabase, open **Project Settings -> API** and copy the **Project URL** into `VITE_SUPABASE_URL` and the browser-safe **Publishable key** (or legacy `anon` key) into `VITE_SUPABASE_ANON_KEY`. Never use a `service_role` or secret key in this file.
4. In Supabase SQL Editor, create the table and row-level security policies:

   ```sql
   create table day_records (
     user_id uuid references auth.users not null,
     day_key text not null,
     record jsonb not null,
     primary key (user_id, day_key)
   );
   alter table day_records enable row level security;
   create policy "Users manage their own records" on day_records
     for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
   ```

5. Restart the Vite server after changing `.env.local`:

   ```powershell
   npm run dev
   ```

6. Create an account or log in. The same account will then see its schedules on another device.

If the message still appears, check that the file is named exactly `.env.local` (not `.env.local.txt`), the variables start with `VITE_`, there are no quotes or extra spaces, and Vite was restarted after saving.

## Deploy to Netlify

1. Push this project to GitHub.
2. In Netlify, choose **Add new site -> Import an existing project**, select the repository, and use:
   - **Build command:** `npm run build`
   - **Publish directory:** `dist`
3. In **Site configuration -> Environment variables**, add:
   - `VITE_SUPABASE_URL` = your Supabase Project URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase Publishable/anon key
4. Deploy the site. `netlify.toml` already configures the build and React SPA fallback.
5. In Supabase, open **Authentication -> URL Configuration** and set:
   - **Site URL:** your Netlify URL, such as `https://your-site.netlify.app`
   - **Redirect URLs:** `https://your-site.netlify.app/**`

After changing environment variables, trigger a new Netlify deploy because Vite embeds `VITE_*` values at build time.
