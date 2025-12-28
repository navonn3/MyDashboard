# 🎵 Sound Management Dashboard - Claude Code Prompt

## משימה ראשית

יש לבנות מערכת ניהול סאונד מקיפה עבור SportFlash AI (Auto-Pod) - מערכת מבזקי ספורט בעברית.

## 📍 מיקום הפרויקט
```
C:\Users\navon\OneDrive\Documents\Python\Auto-Pod
```

## 🎯 מטרות

### 1. דשבורד "ניהול סאונד" (Sound Management)
יש ליצור טאב חדש בדשבורד האדמין בשם "סאונד" או "Sound" שיכלול:

#### א. קטגוריות סאונד (כל אחת בסקשן נפרד):
- **Intro** - פתיחת מבזק
- **Background Music** - מוזיקת רקע (עם ducking אוטומטי)
- **Midtro** - מעברים בין נושאים
- **Outro** - סיום מבזק
- **Ad Intro** - פרסומת פתיחה (להעביר מהמיקום הנוכחי)
- **Ad Outro** - פרסומת סיום (חדש)

#### ב. לכל קובץ סאונד - אפשרות להגדיר התניות (conditions):
```javascript
{
  file_url: "...",
  category: "intro" | "background" | "midtro" | "outro" | "ad_intro" | "ad_outro",
  conditions: {
    // התניות זמן
    max_duration_seconds: 90,  // רק למבזקים עד דקה וחצי
    min_duration_seconds: null,
    
    // התניות תוכן
    sport_ids: [1, 2],  // ספורט ספציפי (null = הכל)
    league_ids: [5, 8], // ליגה ספציפית (null = הכל)
    team_ids: [12],     // קבוצה ספציפית (null = הכל)
    
    // התניות זמן ביום
    time_of_day: "morning" | "evening" | null,
    day_of_week: [0, 6], // סופ"ש בלבד (null = הכל)
    
    // עדיפות
    priority: 1  // במקרה של כמה התאמות, העדיפות הגבוהה תנצח
  },
  is_active: true,
  created_at: "..."
}
```

#### ג. בחירה רנדומית
כאשר יש מספר קבצים עם אותן התניות שמתאימים למבזק, המערכת תבחר באופן רנדומלי.

### 2. מבנה Database (Supabase)

יש ליצור טבלה חדשה `sound_assets`:
```sql
CREATE TABLE sound_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL CHECK (category IN ('intro', 'background', 'midtro', 'outro', 'ad_intro', 'ad_outro')),
  name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size_bytes INTEGER,
  duration_seconds DECIMAL(6,2),
  
  -- Conditions (nullable = no restriction)
  condition_max_duration INTEGER,      -- מבזק עד X שניות
  condition_min_duration INTEGER,      -- מבזק מעל X שניות
  condition_sport_ids INTEGER[],       -- מערך של sport IDs
  condition_league_ids INTEGER[],      -- מערך של league IDs
  condition_team_ids INTEGER[],        -- מערך של team IDs
  condition_time_of_day TEXT CHECK (condition_time_of_day IN ('morning', 'afternoon', 'evening', 'night')),
  condition_days_of_week INTEGER[],    -- 0=Sunday, 6=Saturday
  
  priority INTEGER DEFAULT 0,          -- עדיפות גבוהה יותר = נבחר קודם
  is_active BOOLEAN DEFAULT true,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookups
CREATE INDEX idx_sound_assets_category ON sound_assets(category) WHERE is_active = true;
```

### 3. Backend - API Endpoints

יש ליצור/לעדכן ב-`server.js`:

```javascript
// Sound Assets CRUD
GET    /api/admin/sound-assets          // רשימת כל הקבצים
GET    /api/admin/sound-assets/:id      // קובץ בודד
POST   /api/admin/sound-assets          // העלאת קובץ חדש
PUT    /api/admin/sound-assets/:id      // עדכון קובץ/התניות
DELETE /api/admin/sound-assets/:id      // מחיקה

// Sound Selection (internal use)
POST   /api/internal/select-sounds      // בחירת סאונדים למבזק ספציפי
```

### 4. Frontend - Sound Management Component

יש ליצור `frontend/src/components/admin/SoundManagement.js`:

**מבנה UI:**
```
┌─────────────────────────────────────────────────────────┐
│  🎵 ניהול סאונד                                          │
├─────────────────────────────────────────────────────────┤
│  [Intro] [Background] [Midtro] [Outro] [Ads]  ← טאבים   │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ╔═══════════════════════════════════════════════════╗ │
│  ║  + העלאת קובץ חדש                                 ║ │
│  ╚═══════════════════════════════════════════════════╝ │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎵 intro_energetic.mp3                          │   │
│  │ משך: 5.2 שניות | עדיפות: 1                      │   │
│  │ התניות: מבזק < 90 שניות, כדורגל בלבד           │   │
│  │ [▶️ Play] [✏️ Edit] [🗑️ Delete]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
│  ┌─────────────────────────────────────────────────┐   │
│  │ 🎵 intro_calm.mp3                               │   │
│  │ משך: 4.8 שניות | עדיפות: 0                      │   │
│  │ התניות: אין (ברירת מחדל)                        │   │
│  │ [▶️ Play] [✏️ Edit] [🗑️ Delete]                  │   │
│  └─────────────────────────────────────────────────┘   │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

**מודל עריכה/הוספה:**
```
┌─────────────────────────────────────────────────────────┐
│  הוספת קובץ סאונד - Intro                               │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  שם הקובץ: [________________]                          │
│                                                         │
│  קובץ: [בחר קובץ MP3...] intro_energetic.mp3           │
│                                                         │
│  ─── התניות (אופציונלי) ───                            │
│                                                         │
│  ⏱️ משך מבזק:                                          │
│     מינימום: [____] שניות  מקסימום: [____] שניות       │
│                                                         │
│  ⚽ ספורט: [dropdown multi-select: כדורגל, כדורסל...]   │
│                                                         │
│  🏆 ליגה: [dropdown multi-select: פרמייר ליג...]        │
│                                                         │
│  👥 קבוצה: [dropdown multi-select: מכבי ת"א...]         │
│                                                         │
│  🕐 שעה ביום: [dropdown: בוקר/צהריים/ערב/לילה/הכל]     │
│                                                         │
│  📅 ימים: [checkboxes: א ב ג ד ה ו ש]                  │
│                                                         │
│  ⭐ עדיפות: [slider 0-10]                               │
│                                                         │
│  [ביטול]                              [💾 שמור]         │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

### 5. Audio Processing Module

יש ליצור `backend/audio/processor.js`:

```javascript
/**
 * Audio Processor Module
 * 
 * Responsibilities:
 * 1. Select appropriate sounds based on briefing metadata
 * 2. Apply ducking to background music
 * 3. Mix all audio layers
 * 4. Handle midtros between topics
 */

class AudioProcessor {
  /**
   * Select sounds for a briefing
   * @param {Object} briefingMeta - { duration, sport_ids, league_ids, team_ids, topics }
   * @returns {Object} - { intro, background, midtros, outro, ad_intro, ad_outro }
   */
  async selectSounds(briefingMeta) { }
  
  /**
   * Process and mix audio
   * @param {Buffer} speechAudio - The TTS output
   * @param {Object} sounds - Selected sounds
   * @param {Array} topicBreaks - Timestamps for midtros [12.5, 45.2, ...]
   * @returns {Buffer} - Final mixed audio
   */
  async mixAudio(speechAudio, sounds, topicBreaks) { }
  
  /**
   * Apply ducking - lower music volume when speech is present
   */
  async applyDucking(musicBuffer, speechBuffer, options) { }
}
```

יש גם ליצור `backend/audio/mixer.py` (Python עם pydub):

```python
"""
Audio Mixer using pydub + ffmpeg
Handles: ducking, mixing, crossfades
"""

from pydub import AudioSegment
import sys
import json

def apply_ducking(music_path, speech_path, output_path, duck_level=-15):
    """Lower music volume during speech"""
    pass

def mix_briefing(config_json):
    """
    Mix complete briefing with all audio layers
    Config: { speech, intro, background, midtros, outro, ads, topic_breaks }
    """
    pass

if __name__ == "__main__":
    config = json.loads(sys.argv[1])
    mix_briefing(config)
```

### 6. תיקון העלאת MP3

**בדוק ותקן:**
- וודא שה-Supabase Storage bucket קיים ופעיל
- וודא הרשאות (policies) נכונות
- בדוק את ה-endpoint של ההעלאה
- וודא שה-MIME type נכון (audio/mpeg)

### 7. אינטגרציה עם Generate Flow

עדכן את `POST /api/generate-audio`:

```javascript
// Before: Just TTS
const audioBuffer = await generateTTS(script);

// After: TTS + Sound Processing
const speechBuffer = await generateTTS(script);
const sounds = await audioProcessor.selectSounds({
  duration: estimatedDuration,
  sport_ids: briefingMeta.sport_ids,
  league_ids: briefingMeta.league_ids,
  // ...
});
const topicBreaks = extractTopicBreaks(script); // Find [BREAK] markers
const finalAudio = await audioProcessor.mixAudio(speechBuffer, sounds, topicBreaks);
```

### 8. הגדרות Ducking (בהגדרות מערכת)

הוסף ל-`system_settings`:
```json
{
  "audio": {
    "ducking": {
      "enabled": true,
      "speech_level_db": 0,
      "music_during_speech_db": -18,
      "music_during_break_db": -6,
      "fade_duration_ms": 300
    },
    "midtro": {
      "min_gap_for_midtro_ms": 800,
      "crossfade_ms": 200
    }
  }
}
```

## 📋 סדר עבודה מומלץ

1. **שלב 1 - Database**
   - צור את טבלת `sound_assets`
   - צור migration file חדש
   - הוסף הגדרות audio ל-system_settings

2. **שלב 2 - תיקון העלאת קבצים**
   - בדוק את Supabase Storage
   - תקן את ה-upload endpoint
   - וודא שעובד עם MP3

3. **שלב 3 - Backend API**
   - צור CRUD endpoints ל-sound assets
   - צור endpoint לבחירת סאונדים

4. **שלב 4 - Frontend Component**
   - צור SoundManagement.js
   - הוסף לדשבורד האדמין כטאב חדש
   - העבר את ניהול הפרסומות לשם

5. **שלב 5 - Audio Processing**
   - צור את מודול העיבוד
   - התקן pydub אם צריך
   - ממש ducking בסיסי

6. **שלב 6 - אינטגרציה**
   - חבר את העיבוד ל-generate flow
   - בדוק end-to-end

## 🔧 תלויות להתקנה

```bash
# Python
pip install pydub

# System (אם לא קיים)
# ffmpeg צריך להיות מותקן
```

## ⚠️ הערות חשובות

1. **Supabase Storage** - וודא שה-bucket `audio` קיים עם policies מתאימות
2. **קבצי ברירת מחדל** - חייב להיות לפחות קובץ אחד ללא התניות בכל קטגוריה (fallback)
3. **Performance** - העיבוד יכול לקחת 5-10 שניות, שקול לעשות async
4. **Error Handling** - אם אין קבצי סאונד, המערכת צריכה להמשיך עם TTS בלבד

## 🧪 בדיקות

- [ ] העלאת קובץ MP3 עובדת
- [ ] הצגת רשימת קבצים לפי קטגוריה
- [ ] עריכת התניות
- [ ] מחיקת קובץ
- [ ] בחירה רנדומית כשיש כמה התאמות
- [ ] Ducking עובד נכון
- [ ] Midtros מופיעים בזמן הנכון
- [ ] Fallback כשאין סאונדים

---

**התחל בשלב 1 (Database) והתקדם בסדר. שאל שאלות אם משהו לא ברור.**
