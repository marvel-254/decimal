-- Migration 029: Decimal Tuition — Slice 1 (curriculum spine + teacher builder)
-- 1) programme_lessons.strand_id anchor into curriculum_strands
-- 2) Idempotent CBC (Junior School) curriculum seed
-- All statements are safe to re-run (INSERT ... ON CONFLICT DO NOTHING +
-- WHERE NOT EXISTS guards).

-- ============================================================
-- 1. LESSON → STRAND ANCHOR
-- ============================================================

ALTER TABLE programme_lessons
  ADD COLUMN IF NOT EXISTS strand_id uuid REFERENCES curriculum_strands(id) ON DELETE SET NULL;

-- ============================================================
-- 2. CBC CURRICULUM SEED
--
-- curriculum_strands has UNIQUE(curriculum_subject_id, name, parent_id), but
-- Postgres treats NULLs as distinct in unique indexes, so ON CONFLICT never
-- fires for root strands (parent_id IS NULL). Every strand insert therefore
-- carries an extra WHERE NOT EXISTS guard to stay idempotent across re-runs.
-- ============================================================

INSERT INTO curriculums (name, code, level)
VALUES ('CBC — Competency Based Curriculum', 'cbc', 'junior')
ON CONFLICT (code) DO NOTHING;

INSERT INTO curriculum_subjects (curriculum_id, name, code)
SELECT c.id, s.name, s.code
FROM (VALUES
  ('Mathematics',              'MAT'),
  ('English',                  'ENG'),
  ('Kiswahili',                'KIS'),
  ('Integrated Science',       'SCI'),
  ('Social Studies',           'SST'),
  ('Creative Arts & Sports',   'CAS'),
  ('Pre-Technical Studies',    'PTS'),
  ('Agriculture & Nutrition',  'AGR')
) AS s(name, code)
JOIN curriculums c ON c.code = 'cbc'
ON CONFLICT (curriculum_id, name) DO NOTHING;

INSERT INTO curriculum_strands (curriculum_subject_id, name, sort_order, outcome)
SELECT cs.id, s.name, s.sort_order, s.outcome
FROM (VALUES
  -- Mathematics
  ('Mathematics', 'Number and Algebra', 1, 'Apply number sense, operations and algebraic concepts to solve problems in real-life contexts.'),
  ('Mathematics', 'Measurement', 2, 'Estimate and compute with units of length, mass, capacity, time, money and temperature in practical situations.'),
  ('Mathematics', 'Geometry', 3, 'Construct, describe and reason about shapes, angles, symmetry and space in two and three dimensions.'),
  ('Mathematics', 'Data Handling and Probability', 4, 'Collect, organise, represent and interpret data and simple probabilities to draw conclusions.'),
  ('Mathematics', 'Patterns and Sequences', 5, 'Identify, extend and generalise patterns and sequences using algebraic reasoning.'),
  -- English
  ('English', 'Listening and Speaking', 1, 'Listen actively and speak confidently and fluently in a variety of formal and informal contexts.'),
  ('English', 'Reading', 2, 'Read a range of texts fluently, comprehending, analysing and evaluating meaning and style.'),
  ('English', 'Writing', 3, 'Write coherent, accurate and purposeful texts for different audiences and purposes.'),
  ('English', 'Grammar and Vocabulary', 4, 'Use correct grammatical structures and a growing vocabulary accurately in written and spoken English.'),
  -- Kiswahili
  ('Kiswahili', 'Kusikiliza na Kuzungumza', 1, 'Kusikiliza kwa makini na kuzungumza kwa ufasaha katika miktadha rasmi na isiyo rasmi.'),
  ('Kiswahili', 'Kusoma', 2, 'Kusoma matini mbalimbali kwa ufasaha, kuzielewa, kuzichambua na kuzitathmini.'),
  ('Kiswahili', 'Kuandika', 3, 'Kuandika insha na matini nyingine kwa usahihi, ulinganifu na uwazi.'),
  ('Kiswahili', 'Sarufi na Msamiati', 4, 'Kutumia sarufi sahihi na msamiati mpana katika kuandika na kusema.'),
  -- Integrated Science
  ('Integrated Science', 'Scientific Investigation', 1, 'Plan and carry out scientific investigations, recording and interpreting results safely and accurately.'),
  ('Integrated Science', 'Living Things and Environment', 2, 'Explain the characteristics, structure and interactions of living things with their environment.'),
  ('Integrated Science', 'Matter and Energy', 3, 'Describe the properties of matter and the forms, transfer and conservation of energy.'),
  ('Integrated Science', 'Force, Motion and Work', 4, 'Explain the effects of forces on motion and the relationships in simple machines.'),
  ('Integrated Science', 'Earth and Space', 5, 'Describe the structure of the Earth, weather, climate and key concepts of space.'),
  -- Social Studies
  ('Social Studies', 'People, Population and Social Relations', 1, 'Explore population patterns, social relations and their influence on communities in Kenya and the wider world.'),
  ('Social Studies', 'Resources and Economic Activities', 2, 'Investigate natural resources and economic activities and how they support sustainable development.'),
  ('Social Studies', 'Political Systems and Governance', 3, 'Explain political systems, governance structures and the rule of law at community, national and international levels.'),
  ('Social Studies', 'Citizenship', 4, 'Demonstrate the responsibilities, rights and duties of citizens in a democratic society.'),
  ('Social Studies', 'Environment and Climate Change', 5, 'Analyse environmental challenges including climate change and propose sustainable solutions.'),
  -- Creative Arts & Sports
  ('Creative Arts & Sports', 'Foundation of Creative Arts and Sports', 1, 'Understand core concepts, principles and safety practices in creative arts and sports.'),
  ('Creative Arts & Sports', 'Visual Arts', 2, 'Create and respond to artworks using a variety of media, techniques and processes.'),
  ('Creative Arts & Sports', 'Performing Arts', 3, 'Perform and appraise music, dance and drama drawn from varied Kenyan and global cultures.'),
  ('Creative Arts & Sports', 'Physical Education and Sports', 4, 'Develop fitness, skills and fair play through a range of athletic, games and gymnastic activities.'),
  -- Pre-Technical Studies
  ('Pre-Technical Studies', 'Fundamentals of Pre-Technical Studies', 1, 'Recognise the role of pre-technical skills and the value of appropriate technology in everyday life.'),
  ('Pre-Technical Studies', 'Communication', 2, 'Apply appropriate communication skills and technologies for personal and work-related purposes.'),
  ('Pre-Technical Studies', 'Materials and Tools', 3, 'Identify materials, tools and equipment and use them safely and responsibly.'),
  ('Pre-Technical Studies', 'Energy', 4, 'Explain sources, uses and conservation of energy and their technological applications.'),
  ('Pre-Technical Studies', 'Drawings and Designs', 5, 'Read, interpret and produce simple technical drawings and designs.'),
  -- Agriculture & Nutrition
  ('Agriculture & Nutrition', 'Foundation of Agriculture', 1, 'Appreciate the importance of agriculture in providing food, income and environmental conservation.'),
  ('Agriculture & Nutrition', 'Crop Production', 2, 'Plan and carry out good practices in preparing land, planting, caring for and harvesting crops.'),
  ('Agriculture & Nutrition', 'Animal Production', 3, 'Describe the care, feeding, breeding and welfare of common domestic animals.'),
  ('Agriculture & Nutrition', 'Soil, Water and Environment', 4, 'Explain soil fertility, water management and environmental conservation practices.'),
  ('Agriculture & Nutrition', 'Food and Nutrition', 5, 'Apply principles of food safety, nutrition and meal planning for a balanced diet.')
) AS s(subject_name, name, sort_order, outcome)
JOIN curriculum_subjects cs ON cs.name = s.subject_name
WHERE cs.curriculum_id IN (SELECT id FROM curriculums WHERE code = 'cbc')
  AND NOT EXISTS (
    SELECT 1 FROM curriculum_strands existing
    WHERE existing.curriculum_subject_id = cs.id
      AND existing.name = s.name
      AND existing.parent_id IS NULL
  )
ON CONFLICT (curriculum_subject_id, name, parent_id) DO NOTHING;

-- ============================================================
-- 3. CURRICULUM_SPINE LOOKUP INDEX (strand anchor queries)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_curriculum_strands_parent
  ON curriculum_strands(parent_id);