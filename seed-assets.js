import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function uploadFile(bucket, filePath, fileName) {
    const fileContent = fs.readFileSync(filePath);
    const { data, error } = await supabase.storage.from(bucket).upload(fileName, fileContent, {
        upsert: true
    });
    if (error) {
        console.error(`Error uploading ${fileName}:`, error);
        return null;
    }
    const { data: publicUrlData } = supabase.storage.from(bucket).getPublicUrl(fileName);
    return publicUrlData.publicUrl;
}

async function seed() {
    console.log('Starting upload of placeholders...');
    
    // 1. Collections
    const collectionDir = path.join(process.cwd(), 'placeholders', 'collection-images');
    const colFiles = fs.readdirSync(collectionDir).filter(f => !f.startsWith('.'));
    
    await supabase.from('collection_images').delete().neq('id', 0); // Clear old images

    let order = 1;
    for (const file of colFiles) {
        const url = await uploadFile('meandme_assets', path.join(collectionDir, file), `collections/${file}`);
        if (url) {
            await supabase.from('collection_images').insert({ image_url: url, display_order: order++ });
            console.log(`Added collection image: ${url}`);
        }
    }

    // 2. Stores
    // Store 1: Babelsberg
    // Store 2: Charlottenburg
    const stores = await supabase.from('stores').select('*');
    await supabase.from('store_images').delete().neq('id', 0);

    const storeDirs = ['store-1', 'store-2'];
    for (let i = 0; i < storeDirs.length; i++) {
        const storeDir = path.join(process.cwd(), 'placeholders', 'store-images', storeDirs[i]);
        const sFiles = fs.readdirSync(storeDir).filter(f => !f.startsWith('.'));
        for (const file of sFiles) {
            const url = await uploadFile('meandme_assets', path.join(storeDir, file), `stores/${storeDirs[i]}_${file}`);
            if (url && stores.data[i]) {
                await supabase.from('store_images').insert({ store_id: stores.data[i].id, image_url: url });
                console.log(`Added store image for ${stores.data[i].name}: ${url}`);
            }
        }
    }

    // 3. Brands (Update logo_url where name matches)
    const brandDir = path.join(process.cwd(), 'placeholders', 'brand-logo');
    const bFiles = fs.readdirSync(brandDir).filter(f => !f.startsWith('.'));
    for (const file of bFiles) {
        const url = await uploadFile('meandme_assets', path.join(brandDir, file), `brands/${file}`);
        if (url) {
            // Assume the filename is somewhat matching the brand name e.g., 'savetheduck.png'
            // Since we seeded arbitrary names, we might just insert it as a new brand if not match
            const brandName = path.parse(file).name;
            await supabase.from('brands').insert({ name: brandName, logo_url: url });
            console.log(`Added brand logo: ${url}`);
        }
    }

    console.log('Seeding complete.');
}

seed().catch(console.error);
