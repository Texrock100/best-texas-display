-- BestTexasDisplay.com Database Schema

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(100) NOT NULL,
  role VARCHAR(20) DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  city VARCHAR(100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seasons table
CREATE TABLE IF NOT EXISTS seasons (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  holiday_type VARCHAR(30) NOT NULL CHECK (holiday_type IN ('christmas', 'halloween', 'fourth_of_july', 'valentines', 'easter', 'other')),
  year INTEGER NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  voting_open BOOLEAN DEFAULT FALSE,
  submissions_open BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities table
CREATE TABLE IF NOT EXISTS cities (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  region VARCHAR(50) NOT NULL,
  county VARCHAR(100),
  population INTEGER,
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7)
);

-- Displays table
CREATE TABLE IF NOT EXISTS displays (
  id SERIAL PRIMARY KEY,
  owner_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title VARCHAR(200) NOT NULL,
  description TEXT,
  address VARCHAR(255),
  neighborhood VARCHAR(100),
  city VARCHAR(100) NOT NULL,
  city_id INTEGER REFERENCES cities(id),
  region VARCHAR(50) NOT NULL,
  state VARCHAR(2) DEFAULT 'TX',
  latitude DECIMAL(10, 7),
  longitude DECIMAL(10, 7),
  season_id INTEGER REFERENCES seasons(id) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  vote_count INTEGER DEFAULT 0,
  local_vote_count INTEGER DEFAULT 0,
  featured BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Photos table
CREATE TABLE IF NOT EXISTS photos (
  id SERIAL PRIMARY KEY,
  display_id INTEGER REFERENCES displays(id) ON DELETE CASCADE NOT NULL,
  url VARCHAR(500) NOT NULL,
  thumbnail_url VARCHAR(500),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Votes table (one vote per user per display per season)
CREATE TABLE IF NOT EXISTS votes (
  id SERIAL PRIMARY KEY,
  voter_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  display_id INTEGER REFERENCES displays(id) ON DELETE CASCADE NOT NULL,
  season_id INTEGER REFERENCES seasons(id) NOT NULL,
  voter_city VARCHAR(100),
  ip_address INET,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(voter_id, display_id, season_id)
);

-- Awards table
CREATE TABLE IF NOT EXISTS awards (
  id SERIAL PRIMARY KEY,
  display_id INTEGER REFERENCES displays(id) ON DELETE CASCADE NOT NULL,
  season_id INTEGER REFERENCES seasons(id) NOT NULL,
  category VARCHAR(100) NOT NULL,
  rank INTEGER DEFAULT 1,
  sponsor VARCHAR(200),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_displays_city ON displays(city);
CREATE INDEX IF NOT EXISTS idx_displays_region ON displays(region);
CREATE INDEX IF NOT EXISTS idx_displays_season ON displays(season_id);
CREATE INDEX IF NOT EXISTS idx_displays_status ON displays(status);
CREATE INDEX IF NOT EXISTS idx_displays_vote_count ON displays(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_displays_location ON displays(latitude, longitude);
CREATE INDEX IF NOT EXISTS idx_votes_display ON votes(display_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_id);
CREATE INDEX IF NOT EXISTS idx_votes_season ON votes(season_id);
CREATE INDEX IF NOT EXISTS idx_photos_display ON photos(display_id);
CREATE INDEX IF NOT EXISTS idx_cities_slug ON cities(slug);
CREATE INDEX IF NOT EXISTS idx_cities_region ON cities(region);

-- Seed initial seasons
INSERT INTO seasons (name, holiday_type, year, start_date, end_date, voting_open, submissions_open) VALUES
  ('Halloween 2026', 'halloween', 2026, '2026-10-01', '2026-11-05', true, true),
  ('Christmas 2026', 'christmas', 2026, '2026-11-15', '2027-01-15', true, true)
ON CONFLICT DO NOTHING;

-- Seed Texas regions and major cities
INSERT INTO cities (name, slug, region, county, population, latitude, longitude) VALUES
  ('Dallas', 'dallas', 'DFW', 'Dallas', 1304379, 32.7767, -96.7970),
  ('Fort Worth', 'fort-worth', 'DFW', 'Tarrant', 958692, 32.7555, -97.3308),
  ('Arlington', 'arlington', 'DFW', 'Tarrant', 394266, 32.7357, -97.1081),
  ('Plano', 'plano', 'DFW', 'Collin', 285494, 33.0198, -96.6989),
  ('Frisco', 'frisco', 'DFW', 'Collin', 219587, 33.1507, -96.8236),
  ('McKinney', 'mckinney', 'DFW', 'Collin', 199177, 33.1972, -96.6397),
  ('Grapevine', 'grapevine', 'DFW', 'Tarrant', 54984, 32.9343, -97.0781),
  ('Trophy Club', 'trophy-club', 'DFW', 'Denton', 13687, 33.0015, -97.1836),
  ('Houston', 'houston', 'Houston', 'Harris', 2304580, 29.7604, -95.3698),
  ('Sugar Land', 'sugar-land', 'Houston', 'Fort Bend', 111026, 29.6197, -95.6349),
  ('The Woodlands', 'the-woodlands', 'Houston', 'Montgomery', 118458, 30.1658, -95.4613),
  ('Katy', 'katy', 'Houston', 'Harris', 21894, 29.7858, -95.8245),
  ('Austin', 'austin', 'Austin', 'Travis', 979882, 30.2672, -97.7431),
  ('Round Rock', 'round-rock', 'Austin', 'Williamson', 133372, 30.5083, -97.6789),
  ('Georgetown', 'georgetown', 'Austin', 'Williamson', 75420, 30.6333, -97.6781),
  ('San Antonio', 'san-antonio', 'San Antonio', 'Bexar', 1451853, 29.4241, -98.4936),
  ('New Braunfels', 'new-braunfels', 'San Antonio', 'Comal', 98857, 29.7030, -98.1245),
  ('Windcrest', 'windcrest', 'San Antonio', 'Bexar', 5829, 29.5158, -98.3806),
  ('El Paso', 'el-paso', 'El Paso', 'El Paso', 681728, 31.7619, -106.4850),
  ('Lubbock', 'lubbock', 'Panhandle', 'Lubbock', 263584, 33.5779, -101.8552),
  ('Amarillo', 'amarillo', 'Panhandle', 'Potter', 200393, 35.2220, -101.8313),
  ('Corpus Christi', 'corpus-christi', 'South Texas', 'Nueces', 317863, 27.8006, -97.3964),
  ('McAllen', 'mcallen', 'South Texas', 'Hidalgo', 142210, 26.2034, -98.2300),
  ('Longview', 'longview', 'East Texas', 'Gregg', 82092, 32.5007, -94.7405),
  ('Tyler', 'tyler', 'East Texas', 'Smith', 107405, 32.3513, -95.3011),
  ('Waco', 'waco', 'Central Texas', 'McLennan', 142228, 31.5493, -97.1467),
  ('College Station', 'college-station', 'Central Texas', 'Brazos', 120511, 30.6280, -96.3344),
  ('Johnson City', 'johnson-city', 'Central Texas', 'Blanco', 1656, 30.2769, -98.4153)
ON CONFLICT (slug) DO NOTHING;
