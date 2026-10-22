const fs = require('fs');
const path = require('path');

// Use the actual project root
const projectRoot = path.resolve(__dirname, '..', '..');
const filePath = path.join(projectRoot, 'src/components/landing/LandingPage.tsx');
console.log('Reading file from:', filePath);

let content = fs.readFileSync(filePath, 'utf8');
console.log('File size:', content.length, 'bytes');

// Remove the DOCTOR_REVIEWS dummy data (including the comment before it)
const doctorReviewsRegex = /\/\/ নমুনা তথ্য — আসল রিভিউ পেলে এগুলো বদলে দিন\nconst DOCTOR_REVIEWS = \[[\s\S]*?\];\n?/;
const newContent = content.replace(doctorReviewsRegex, '');

if (newContent === content) {
  console.log('WARNING: No changes made - regex did not match');
} else {
  fs.writeFileSync(filePath, newContent, 'utf8');
  console.log('Successfully removed DOCTOR_REVIEWS dummy data');
}

// Count remaining dummy data references
const remainingOnlinedoctors = newContent.match(/ONLINE_DOCTORS/g) || [];
const remainingDoctorReviews = newContent.match(/DOCTOR_REVIEWS/g) || [];
console.log('ONLINE_DOCTORS references:', remainingOnlinedoctors.length);
console.log('DOCTOR_REVIEWS references:', remainingDoctorReviews.length);
