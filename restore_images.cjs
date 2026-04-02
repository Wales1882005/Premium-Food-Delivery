const { execSync } = require('child_process');
try {
  const output = execSync('git show HEAD~2:src/data/mockData.ts').toString();
  require('fs').writeFileSync('src/data/mockData.ts', output);
  console.log('Restored mockData.ts');
  
  const home = execSync('git show HEAD~2:src/components/Home.tsx').toString();
  require('fs').writeFileSync('src/components/Home.tsx', home);
  console.log('Restored Home.tsx');

  const profile = execSync('git show HEAD~2:src/components/Profile.tsx').toString();
  require('fs').writeFileSync('src/components/Profile.tsx', profile);
  console.log('Restored Profile.tsx');

  const search = execSync('git show HEAD~2:src/components/Search.tsx').toString();
  require('fs').writeFileSync('src/components/Search.tsx', search);
  console.log('Restored Search.tsx');

  const cart = execSync('git show HEAD~2:src/components/CartDrawer.tsx').toString();
  require('fs').writeFileSync('src/components/CartDrawer.tsx', cart);
  console.log('Restored CartDrawer.tsx');

  const menu = execSync('git show HEAD~2:src/components/RestaurantMenu.tsx').toString();
  require('fs').writeFileSync('src/components/RestaurantMenu.tsx', menu);
  console.log('Restored RestaurantMenu.tsx');
} catch (e) {
  console.error(e.message);
}
