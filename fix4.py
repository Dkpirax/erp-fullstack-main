import os

files = [
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
]

count = 0
for f in files:
    full_path = os.path.join(os.getcwd(), f)
    if os.path.exists(full_path):
        with open(full_path, 'r', encoding='utf-8') as file:
            c = file.read()
        if 'http://localhost:8000' in c:
            with open(full_path, 'w', encoding='utf-8') as file:
                file.write(c.replace('http://localhost:8000', ''))
                count += 1
                print(f"Fixed {f}")
    else:
        print(f"File {f} not found at {full_path}!")

print(f"Total fixed: {count}")
