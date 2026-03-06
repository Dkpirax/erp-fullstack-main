const fs = require('fs');

const files = [
    'client/src/pages/woocommerce/WooCommerceOrders.tsx',
    'client/src/pages/woocommerce/WooCommerceDashboard.tsx',
    'client/src/pages/social_media/UnifiedInbox.tsx',
    'client/src/pages/social_media/SocialMediaSettings.tsx',
    'client/src/pages/social_media/SocialMediaDashboard.tsx',
    'client/src/pages/social_media/Campaigns.tsx',
    'client/src/pages/pos/POSInterface.tsx',
    'client/src/pages/daraz/DarazSettings.tsx',
    'client/src/pages/daraz/DarazProducts.tsx',
    'client/src/pages/daraz/DarazOrders.tsx',
    'client/src/pages/daraz/DarazDashboard.tsx',
    'client/src/hooks/useLoyaltySettings.ts',
    'client/src/hooks/useCoupons.ts'
];

files.forEach(f => {
    try {
        let content = fs.readFileSync(f, 'utf8');
        let newContent = content.split('http://localhost:8000').join('');
        if (content !== newContent) {
            fs.writeFileSync(f, newContent, 'utf8');
            console.log('Fixed:', f);
        } else {
            console.log('No changes needed in:', f);
        }
    } catch (e) {
        console.error('Error on', f, e.message);
    }
});
