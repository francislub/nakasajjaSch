-- Create initial admin user
INSERT INTO users (email, password, name, role, createdAt, updatedAt) VALUES 
('admin@holyfamily.edu', '$2a$12$LQv3c1yqBwEHxPr9uuWOVOaih2Z/.1MI7BPA4G5wmpmEhxHc9jI3K', 'System Administrator', 'ADMIN', NOW(), NOW());

-- Create academic year
INSERT INTO academic_years (year, startDate, endDate, isActive, createdAt, updatedAt) VALUES 
('2024-2025', '2024-01-01', '2024-12-31', true, NOW(), NOW());

-- Create terms
INSERT INTO terms (name, startDate, endDate, academicYearId, createdAt, updatedAt) VALUES 
('Term 1', '2024-01-01', '2024-04-30', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW()),
('Term 2', '2024-05-01', '2024-08-31', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW()),
('Term 3', '2024-09-01', '2024-12-31', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW());

-- Create classes
INSERT INTO classes (name, academicYearId, createdAt, updatedAt) VALUES 
('Primary 1', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW()),
('Primary 2', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW()),
('Primary 3', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW()),
('Primary 4', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW()),
('Primary 5', (SELECT id FROM academic_years WHERE year = '2024-2025'), NOW(), NOW());

-- Create subjects
INSERT INTO subjects (name, code, classId, createdAt, updatedAt) VALUES 
('English', 'ENG', (SELECT id FROM classes WHERE name = 'Primary 1'), NOW(), NOW()),
('Mathematics', 'MATH', (SELECT id FROM classes WHERE name = 'Primary 1'), NOW(), NOW()),
('Science', 'SCI', (SELECT id FROM classes WHERE name = 'Primary 1'), NOW(), NOW()),
('Social Studies and Religious Education', 'SSRE', (SELECT id FROM classes WHERE name = 'Primary 1'), NOW(), NOW());

-- Create grading system
INSERT INTO grading_system (grade, minMark, maxMark, comment, createdAt, updatedAt) VALUES 
('A', 85, 100, 'Very Good', NOW(), NOW()),
('B', 80, 84, 'Good', NOW(), NOW()),
('C', 70, 79, 'Fair', NOW(), NOW()),
('D', 60, 69, 'Needs Improvement', NOW(), NOW()),
('F', 0, 59, 'Fail', NOW(), NOW());

-- Create sample class teacher
INSERT INTO users (email, password, name, role, classId, createdAt, updatedAt) VALUES 
('teacher@holyfamily.edu', '$2a$12$LQv3c1yqBwEHxPr9uuWOVOaih2Z/.1MI7BPA4G5wmpmEhxHc9jI3K', 'John Smith', 'CLASS_TEACHER', (SELECT id FROM classes WHERE name = 'Primary 1'), NOW(), NOW());

-- Create sample parent
INSERT INTO users (email, password, name, role, createdAt, updatedAt) VALUES 
('parent@holyfamily.edu', '$2a$12$LQv3c1yqBwEHxPr9uuWOVOaih2Z/.1MI7BPA4G5wmpmEhxHc9jI3K', 'Mary Johnson', 'PARENT', NOW(), NOW());

-- Create sample secretary
INSERT INTO users (email, password, name, role, createdAt, updatedAt) VALUES 
('secretary@holyfamily.edu', '$2a$12$LQv3c1yqBwEHxPr9uuWOVOaih2Z/.1MI7BPA4G5wmpmEhxHc9jI3K', 'Sarah Wilson', 'SECRETARY', NOW(), NOW());
