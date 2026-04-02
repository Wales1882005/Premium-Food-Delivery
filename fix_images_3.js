import fs from 'fs';

let profileData = fs.readFileSync('src/components/Profile.tsx', 'utf-8');

// Replace category images
profileData = profileData.replace(/'([^']+)':\s*'https:\/\/images\.unsplash\.com\/photo-[^']+'/g, (match, name) => {
  const encodedName = encodeURIComponent(name.toLowerCase() + ' food');
  const newImage = `'${name}': 'https://image.pollinations.ai/prompt/${encodedName}?width=800&height=600&nologo=true&seed=42'`;
  return newImage;
});

fs.writeFileSync('src/components/Profile.tsx', profileData);

console.log('Done');
