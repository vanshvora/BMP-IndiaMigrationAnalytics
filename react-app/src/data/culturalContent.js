import { CULTURAL_CATEGORIES } from '../utils/culturalAssets';

const CULTURAL_DATA = {
    'Andaman and Nicobar': {
        dance: { name: 'Nicobarese Dance', caption: 'Group performance traditions of the Nicobarese island communities.', image: 'dance.jpg' },
        dress: { name: 'Nicobarese Traditional Attire', caption: 'Traditional dress with headgear and ornamentation of the Nicobarese people.', image: 'dress.jpg' },
        festival: { name: 'Andaman and Nicobar Islands Festival', caption: 'Island-wide celebrations reflecting the unique cultural blend of the archipelago.', image: 'festival.jpg' },
        food: { name: 'Andaman and Nicobar Cuisine', caption: 'Seafood-and-coconut based food traditions of the island communities.', image: 'food.jpg' },
        heritage: { name: 'Cellular Jail', caption: 'A colonial-era prison turned national memorial, symbolizing India\'s freedom struggle.', image: 'heritage.jpg' },
    },
    'Andhra Pradesh': {
        dance: { name: 'Kuchipudi', caption: 'A classical dance tradition known for expressive storytelling and stylized movement.', image: 'dance.jpg' },
        dress: { name: 'Dharmavaram Saree', caption: 'A richly woven silk saree tradition from the Dharmavaram region.', image: 'dress.jpg' },
        festival: { name: 'Ugadi', caption: 'The Telugu New Year marking the beginning of a new Hindu lunisolar calendar year.', image: 'festival.jpg' },
        food: { name: 'Pesarattu', caption: 'A savory green gram crepe, a beloved Andhra Pradesh breakfast staple.', image: 'food.jpg' },
        heritage: { name: 'Tirumala Venkateswara Temple', caption: 'One of the most visited and revered Hindu temples in the world.', image: 'heritage.jpg' },
    },
    'Arunachal Pradesh': {
        dance: { name: 'Cham Dance', caption: 'A colorful masked dance performed at Buddhist monasteries during festivals.', image: 'dance.jpg' },
        dress: { name: 'Apatani Traditional Attire', caption: 'Traditional clothing and adornment of the Apatani people.', image: 'dress.jpg' },
        festival: { name: 'Losar', caption: 'The Tibetan New Year celebrated with prayers, dances, and community feasting.', image: 'festival.jpg' },
        food: { name: 'Thukpa', caption: 'A hearty Tibetan noodle soup popular in the highland communities.', image: 'food.jpg' },
        heritage: { name: 'Tawang Monastery', caption: 'The largest monastery in India, perched in the Himalayan mountains of Tawang.', image: 'heritage.jpg' },
    },
    Assam: {
        dance: { name: 'Bhortal Dance', caption: 'A folk dance performed with brass cymbals during festive celebrations.', image: 'dance.jpg' },
        dress: { name: 'Mekhela Chador', caption: 'Traditional Assamese attire known for woven elegance and regional motifs.', image: 'dress.jpg' },
        festival: { name: 'Bihu', caption: 'Assam\'s most important festival marking the agricultural seasons with music, dance, and feasting.', image: 'festival.jpg' },
        food: { name: 'Assam Tea', caption: 'World-renowned tea from the lush plantations of Assam.', image: 'food.jpg' },
        heritage: { name: 'Kaziranga National Park', caption: 'A UNESCO World Heritage Site famous for the Indian one-horned rhinoceros.', image: 'heritage.jpg' },
    },
    Bihar: {
        dance: { name: 'Jat-Jatin Dance', caption: 'A folk dance depicting the love story and daily life of a rural couple.', image: 'dance.jpg' },
        dress: { name: 'Dhoti', caption: 'A traditional unstitched garment draped around the waist and legs.', image: 'dress.jpg' },
        festival: { name: 'Chhath', caption: 'An ancient Hindu festival dedicated to the Sun God, celebrated with riverbank rituals.', image: 'festival.jpg' },
        food: { name: 'Litti Chokha', caption: 'Wheat dough balls stuffed with sattu, served with mashed vegetables.', image: 'food.jpg' },
        heritage: { name: 'Mahabodhi Temple', caption: 'A UNESCO World Heritage Site where Gautama Buddha attained enlightenment.', image: 'heritage.jpg' },
    },
    Chandigarh: {
        dance: { name: 'Bhangra', caption: 'A high-energy Punjabi folk dance performed with rhythmic beats and vibrant costumes.', image: 'dance.jpg' },
        dress: { name: 'Phulkari', caption: 'Embroidered textile art featuring colorful geometric floral patterns.', image: 'dress.jpg' },
        festival: { name: 'Rose Festival Chandigarh', caption: 'An annual celebration of roses held in the Zakir Hussain Rose Garden.', image: 'festival.jpg' },
        food: { name: 'Butter Chicken', caption: 'A rich, creamy tomato-based chicken curry and a North Indian culinary icon.', image: 'food.jpg' },
        heritage: { name: 'Rock Garden of Chandigarh', caption: 'A sculpture garden built with industrial and home waste by artist Nek Chand.', image: 'heritage.jpg' },
    },
    Chhattisgarh: {
        dance: { name: 'Panthi Dance', caption: 'A devotional folk dance of the Satnami community, performed with rhythmic vigor.', image: 'dance.jpg' },
        dress: { name: 'Kosa Silk', caption: 'A handwoven tussar silk textile prized for its natural golden sheen.', image: 'dress.jpg' },
        festival: { name: 'Bastar Dussehra', caption: 'A unique 75-day tribal festival in the Bastar region, distinct from mainstream Dussehra.', image: 'festival.jpg' },
        food: { name: 'Fara', caption: 'Steamed rice flour dumplings stuffed with lentils or vegetables.', image: 'food.jpg' },
        heritage: { name: 'Chitrakote Falls', caption: 'The broadest waterfall in India, often called the "Niagara of India."', image: 'heritage.jpg' },
    },
    'Dadra and Nagar Haveli and Daman and Diu': {
        dance: { name: 'Tarpa Dance', caption: 'A tribal folk dance performed in a circle to the music of the Tarpa wind instrument.', image: 'dance.jpg' },
        dress: { name: 'Warli Art Inspired Attire', caption: 'Textile traditions featuring motifs from Warli tribal art.', image: 'dress.jpg' },
        festival: { name: 'Nariyal Purnima', caption: 'A coastal festival marking the end of the monsoon with coconut offerings to the sea.', image: 'festival.jpg' },
        food: { name: 'Daman and Diu Cuisine', caption: 'Coastal cuisine blending Portuguese influences with local seafood traditions.', image: 'food.jpg' },
        heritage: { name: 'Diu Fort', caption: 'A 16th-century Portuguese fort overlooking the Arabian Sea.', image: 'heritage.jpg' },
    },
    Delhi: {
        dance: { name: 'Kathak', caption: 'A classical North Indian dance known for intricate footwork and expressive storytelling.', image: 'dance.jpg' },
        dress: { name: 'Salwar Kameez', caption: 'A widely worn traditional outfit consisting of a tunic top and loose trousers.', image: 'dress.jpg' },
        festival: { name: 'Diwali in Delhi', caption: 'The festival of lights celebrated with diyas, rangoli, fireworks, and community gatherings.', image: 'festival.jpg' },
        food: { name: 'Chole Bhature', caption: 'Spiced chickpea curry served with deep-fried puffed bread.', image: 'food.jpg' },
        heritage: { name: 'Red Fort', caption: 'A UNESCO World Heritage Site and iconic Mughal-era fortress in the heart of Delhi.', image: 'heritage.jpg' },
    },
    Goa: {
        dance: { name: 'Fugdi', caption: 'A traditional Goan folk dance performed by women in a circle with rhythmic clapping.', image: 'dance.jpg' },
        dress: { name: 'Kunbi Saree', caption: 'A traditional red-checkered saree worn by the Kunbi community.', image: 'dress.jpg' },
        festival: { name: 'Carnival in Goa', caption: 'A vibrant multi-day carnival with parades, music, and street celebrations.', image: 'festival.jpg' },
        food: { name: 'Goan Cuisine', caption: 'A culinary tradition blending Portuguese influences with local spices and seafood.', image: 'food.jpg' },
        heritage: { name: 'Basilica of Bom Jesus', caption: 'A UNESCO World Heritage Site housing the remains of St. Francis Xavier.', image: 'heritage.jpg' },
    },
    Gujarat: {
        dance: { name: 'Garba', caption: 'A vibrant folk dance with circular movement and festive community participation.', image: 'dance.jpg' },
        dress: { name: 'Lehenga', caption: 'A festive embroidered skirt ensemble with bright colors and mirror work.', image: 'dress.jpg' },
        festival: { name: 'Navratri', caption: 'A nine-night festival of dance, devotion, and color celebrating the goddess Durga.', image: 'festival.jpg' },
        food: { name: 'Dhokla', caption: 'A savory steamed cake made from fermented batter, a quintessential Gujarati snack.', image: 'food.jpg' },
        heritage: { name: 'Rani ki Vav', caption: 'A UNESCO World Heritage Site - an intricately carved stepwell on the Saraswati River.', image: 'heritage.jpg' },
    },
    Haryana: {
        dance: { name: 'Swang', caption: 'A traditional folk theatre combining dance, music, and drama.', image: 'dance.jpg' },
        dress: { name: 'Ghagra Choli', caption: 'A traditional outfit with a flared skirt and fitted blouse.', image: 'dress.jpg' },
        festival: { name: 'Teej', caption: 'A monsoon festival celebrating Shiva and Parvati with swings, songs, and green attire.', image: 'festival.jpg' },
        food: { name: 'Bajra Roti', caption: 'Flatbread made from pearl millet, a staple grain of Haryana.', image: 'food.jpg' },
        heritage: { name: 'Kurukshetra', caption: 'An ancient city of historical and mythological significance, tied to the Mahabharata.', image: 'heritage.jpg' },
    },
    'Himachal Pradesh': {
        dance: { name: 'Nati', caption: 'A group folk dance of hill communities performed during festive gatherings.', image: 'dance.jpg' },
        dress: { name: 'Himachali Cap', caption: 'A distinctive round cap with a colorful band, symbolizing Himachali identity.', image: 'dress.jpg' },
        festival: { name: 'Kullu Dussehra', caption: 'A week-long festival in the Kullu Valley with processions of local deities.', image: 'festival.jpg' },
        food: { name: 'Siddu', caption: 'A steamed wheat bread stuffed with poppy seeds or lentils.', image: 'food.jpg' },
        heritage: { name: 'Spiti Valley', caption: 'A remote Himalayan desert valley known for ancient monasteries and stark landscapes.', image: 'heritage.jpg' },
    },
    'Jammu and Kashmir': {
        dance: { name: 'Rouf Dance', caption: 'A graceful Kashmiri folk dance performed by women during spring festivals.', image: 'dance.jpg' },
        dress: { name: 'Pheran', caption: 'A long loose garment with intricate embroidery, worn for warmth in Kashmir.', image: 'dress.jpg' },
        festival: { name: 'Tulip Garden (Srinagar)', caption: 'The annual tulip festival at Asia\'s largest tulip garden in Srinagar.', image: 'festival.jpg' },
        food: { name: 'Rogan Josh', caption: 'An aromatic lamb curry with deep red color, a signature Kashmiri Wazwan dish.', image: 'food.jpg' },
        heritage: { name: 'Dal Lake', caption: 'The iconic lake of Srinagar, known for houseboats, shikaras, and Mughal gardens.', image: 'heritage.jpg' },
    },
    Jharkhand: {
        dance: { name: 'Chhau Dance', caption: 'A semi-classical masked dance blending martial arts, tribal, and folk traditions.', image: 'dance.jpg' },
        dress: { name: 'Tussar Silk', caption: 'A handwoven wild silk textile known for its rich golden texture.', image: 'dress.jpg' },
        festival: { name: 'Sarhul', caption: 'A spring festival celebrating the marriage of the earth and sky.', image: 'festival.jpg' },
        food: { name: 'Dhuska', caption: 'A deep-fried rice and lentil pancake, a popular Jharkhand snack.', image: 'food.jpg' },
        heritage: { name: 'Betla National Park', caption: 'A tiger reserve and national park in the Palamau Hills.', image: 'heritage.jpg' },
    },
    Karnataka: {
        dance: { name: 'Yakshagana', caption: 'A theatrical dance-drama marked by elaborate costume and expressive staging.', image: 'dance.jpg' },
        dress: { name: 'Ilkal Saree', caption: 'A traditional handloom saree from Ilkal, known for its distinctive pallu.', image: 'dress.jpg' },
        festival: { name: 'Mysore Dasara', caption: 'A grand 10-day royal celebration in Mysore with processions and illuminations.', image: 'festival.jpg' },
        food: { name: 'Bisi Bele Bath', caption: 'A spicy rice-lentil dish with vegetables, tamarind, and aromatic spices.', image: 'food.jpg' },
        heritage: { name: 'Hampi', caption: 'A UNESCO World Heritage Site with ruins of the Vijayanagara Empire.', image: 'heritage.jpg' },
    },
    Kerala: {
        dance: { name: 'Kathakali', caption: 'A richly costumed classical dance-drama built on dramatic expression and storytelling.', image: 'dance.jpg' },
        dress: { name: 'Mundu', caption: 'A white or cream-colored garment draped around the waist, traditional to Kerala.', image: 'dress.jpg' },
        festival: { name: 'Onam', caption: 'Kerala\'s harvest festival celebrated with floral carpets, feasts, and boat races.', image: 'festival.jpg' },
        food: { name: 'Sadya', caption: 'A lavish vegetarian feast served on a banana leaf during celebrations.', image: 'food.jpg' },
        heritage: { name: 'Kerala Backwaters', caption: 'A network of canals, rivers, and lakes stretching along the Malabar Coast.', image: 'heritage.jpg' },
    },
    Ladakh: {
        dance: { name: 'Cham Dance', caption: 'A sacred masked dance performed at Buddhist monastery festivals.', image: 'dance.jpg' },
        dress: { name: 'Ladakhi Clothing', caption: 'Traditional woolen highland garments suited to Ladakh\'s extreme climate.', image: 'dress.jpg' },
        festival: { name: 'Hemis Festival', caption: 'A colorful monastery festival celebrating Guru Padmasambhava\'s birth anniversary.', image: 'festival.jpg' },
        food: { name: 'Thukpa', caption: 'A warming Tibetan noodle soup, a staple comfort food in Ladakh.', image: 'food.jpg' },
        heritage: { name: 'Pangong Tso', caption: 'A stunning high-altitude lake stretching across India and China.', image: 'heritage.jpg' },
    },
    Lakshadweep: {
        dance: { name: 'Lakshadweep Dance', caption: 'Traditional island dance forms reflecting the maritime culture of Lakshadweep.', image: 'dance.jpg' },
        dress: { name: 'Lakshadweep Attire', caption: 'Traditional island clothing adapted to the tropical climate.', image: 'dress.jpg' },
        festival: { name: 'Lakshadweep Festival', caption: 'Island festivals blending Islamic traditions with local customs.', image: 'festival.jpg' },
        food: { name: 'Lakshadweep Cuisine', caption: 'Coconut and seafood-based cuisine of the coral island communities.', image: 'food.jpg' },
        heritage: { name: 'Lakshadweep Islands', caption: 'A pristine coral archipelago with turquoise lagoons and rich marine life.', image: 'heritage.jpg' },
    },
    'Madhya Pradesh': {
        dance: { name: 'Matki Folk Dance', caption: 'A graceful folk dance where women balance earthen pots on their heads.', image: 'dance.jpg' },
        dress: { name: 'Chanderi Saree', caption: 'A sheer, lightweight handloom saree known for fine texture and zari work.', image: 'dress.jpg' },
        festival: { name: 'Khajuraho Dance Festival', caption: 'An annual classical dance festival held at the backdrop of Khajuraho temples.', image: 'festival.jpg' },
        food: { name: 'Poha', caption: 'Flattened rice tempered with spices, a beloved breakfast staple.', image: 'food.jpg' },
        heritage: { name: 'Khajuraho Group of Monuments', caption: 'A UNESCO World Heritage Site with stunning sculptured Chandela dynasty temples.', image: 'heritage.jpg' },
    },
    Maharashtra: {
        dance: { name: 'Lavani', caption: 'A dynamic folk dance-music genre known for powerful rhythm and expression.', image: 'dance.jpg' },
        dress: { name: 'Nauvari Saree', caption: 'A nine-yard saree draped in a distinctive style by Marathi women.', image: 'dress.jpg' },
        festival: { name: 'Ganesh Chaturthi', caption: 'A grand 10-day festival with elaborate Ganesha idol installations and processions.', image: 'festival.jpg' },
        food: { name: 'Vada Pav', caption: 'Mumbai\'s iconic street food - a spiced potato fritter in a bread bun.', image: 'food.jpg' },
        heritage: { name: 'Ajanta Caves', caption: 'A UNESCO World Heritage Site with 2nd century BCE rock-cut Buddhist cave monuments.', image: 'heritage.jpg' },
    },
    Manipur: {
        dance: { name: 'Manipuri Dance', caption: 'A classical dance characterized by graceful, fluid movements and devotional themes.', image: 'dance.jpg' },
        dress: { name: 'Phanek', caption: 'A traditional wrap-around garment with intricate woven patterns.', image: 'dress.jpg' },
        festival: { name: 'Yaoshang', caption: 'Manipur\'s version of Holi, a five-day festival of colors and community celebration.', image: 'festival.jpg' },
        food: { name: 'Eromba', caption: 'Boiled vegetables and fish mashed with chillies and fermented fish.', image: 'food.jpg' },
        heritage: { name: 'Loktak Lake', caption: 'The largest freshwater lake in Northeast India, known for floating phumdis.', image: 'heritage.jpg' },
    },
    Meghalaya: {
        dance: { name: 'Nongkrem Dance', caption: 'A sacred five-day thanksgiving dance festival of the Khasi people.', image: 'dance.jpg' },
        dress: { name: 'Jainsem', caption: 'The traditional layered dress of Khasi women.', image: 'dress.jpg' },
        festival: { name: 'Wangala Festival', caption: 'A post-harvest thanksgiving of the Garo community, the "100 Drums Festival."', image: 'festival.jpg' },
        food: { name: 'Jadoh', caption: 'A fragrant rice dish cooked with pork or chicken.', image: 'food.jpg' },
        heritage: { name: 'Living Root Bridge', caption: 'Bio-engineered bridges grown from aerial roots of rubber fig trees by Khasi and Jaintia people.', image: 'heritage.jpg' },
    },
    Mizoram: {
        dance: { name: 'Cheraw Dance', caption: 'A traditional bamboo dance with performers stepping between clapping bamboo poles.', image: 'dance.jpg' },
        dress: { name: 'Puan', caption: 'A handwoven wraparound garment with colorful stripes, traditional to the Mizo people.', image: 'dress.jpg' },
        festival: { name: 'Chapchar Kut', caption: 'A spring festival celebrating the clearing of jungles for jhum cultivation.', image: 'festival.jpg' },
        food: { name: 'Mizo Cuisine', caption: 'Cuisine centered on boiled and steamed preparations with bamboo shoots and herbs.', image: 'food.jpg' },
        heritage: { name: 'Phawngpui', caption: 'The "Blue Mountain" - the highest peak in Mizoram, rich in biodiversity.', image: 'heritage.jpg' },
    },
    Nagaland: {
        dance: { name: 'Naga Warrior Dance', caption: 'A traditional war dance performed with spears, shields, and ceremonial regalia.', image: 'dance.jpg' },
        dress: { name: 'Lotha Naga Attire', caption: 'Traditional shawls and garments of the Lotha Naga tribe with distinctive patterns.', image: 'dress.jpg' },
        festival: { name: 'Hornbill Festival', caption: 'A 10-day festival showcasing the culture and traditions of all Naga tribes.', image: 'festival.jpg' },
        food: { name: 'Akhuni', caption: 'A pungent fermented soybean preparation, a key flavoring in Naga cuisine.', image: 'food.jpg' },
        heritage: { name: 'Dzukou Valley', caption: 'A pristine valley of rolling hills and seasonal wildflowers on the Nagaland-Manipur border.', image: 'heritage.jpg' },
    },
    Odisha: {
        dance: { name: 'Odissi', caption: 'A classical dance form marked by sculptural posture and lyrical expression.', image: 'dance.jpg' },
        dress: { name: 'Sambalpuri Saree', caption: 'A handwoven ikat saree from western Odisha with bold geometric patterns.', image: 'dress.jpg' },
        festival: { name: 'Ratha Yatra', caption: 'The grand chariot festival of Lord Jagannath at Puri.', image: 'festival.jpg' },
        food: { name: 'Pakhala', caption: 'Fermented rice soaked in water, a cooling summer staple of Odisha.', image: 'food.jpg' },
        heritage: { name: 'Konark Sun Temple', caption: 'A UNESCO World Heritage Site designed as a colossal chariot of the Sun God.', image: 'heritage.jpg' },
    },
    Puducherry: {
        dance: { name: 'Bharatanatyam', caption: 'A classical South Indian dance with geometric posture and spiritual expression.', image: 'dance.jpg' },
        dress: { name: 'Saree', caption: 'The traditional draped garment styled distinctively in Puducherry.', image: 'dress.jpg' },
        festival: { name: 'Puducherry Festival', caption: 'Festivals reflecting a unique Franco-Tamil cultural blend.', image: 'festival.jpg' },
        food: { name: 'Pondicherry Cuisine', caption: 'A distinctive Franco-Tamil culinary tradition blending French and South Indian flavors.', image: 'food.jpg' },
        heritage: { name: 'French Quarter Pondicherry', caption: 'The colonial-era French Quarter with pastel-colored buildings and tree-lined boulevards.', image: 'heritage.jpg' },
    },
    Punjab: {
        dance: { name: 'Bhangra', caption: 'A high-energy Punjabi folk dance with festive music and vibrant costume.', image: 'dance.jpg' },
        dress: { name: 'Phulkari', caption: 'Embroidered textile work featuring vibrant floral patterns.', image: 'dress.jpg' },
        festival: { name: 'Lohri', caption: 'A winter harvest festival celebrated with bonfires, music, and festive foods.', image: 'festival.jpg' },
        food: { name: 'Makki di Roti', caption: 'A maize flour flatbread traditionally paired with Sarson da Saag.', image: 'food.jpg' },
        heritage: { name: 'Golden Temple', caption: 'The holiest Sikh gurdwara, a gold-plated shrine set in a sacred pool in Amritsar.', image: 'heritage.jpg' },
    },
    Rajasthan: {
        dance: { name: 'Ghoomar', caption: 'A colorful folk dance with swirling skirts performed by women during festivals.', image: 'dance.jpg' },
        dress: { name: 'Rajasthani Clothing', caption: 'Vibrant traditional attire with colorful turbans, ghagras, and mirror work.', image: 'dress.jpg' },
        festival: { name: 'Pushkar Fair', caption: 'One of the world\'s largest camel fairs, with livestock trading and cultural shows.', image: 'festival.jpg' },
        food: { name: 'Dal Baati', caption: 'Baked wheat dough balls served with spiced lentils and ghee.', image: 'food.jpg' },
        heritage: { name: 'Hawa Mahal', caption: 'The "Palace of Winds" in Jaipur - a five-story pink sandstone façade with 953 windows.', image: 'heritage.jpg' },
    },
    Sikkim: {
        dance: { name: 'Singhi Chham Dance', caption: 'A vibrant masked dance depicting the snow lion, performed at monastery festivals.', image: 'dance.jpg' },
        dress: { name: 'Bakhu', caption: 'A traditional Sikkimese silk robe worn over a blouse with a belt.', image: 'dress.jpg' },
        festival: { name: 'Losoong', caption: 'The Sikkimese New Year celebrated with Chaam dances and traditional archery.', image: 'festival.jpg' },
        food: { name: 'Momos', caption: 'Steamed or fried dumplings filled with meat or vegetables.', image: 'food.jpg' },
        heritage: { name: 'Rumtek Monastery', caption: 'The largest monastery in Sikkim, seat of the Karmapa lineage.', image: 'heritage.jpg' },
    },
    'Tamil Nadu': {
        dance: { name: 'Bharatanatyam', caption: 'A classical solo dance known for geometric posture and expressive storytelling.', image: 'dance.jpg' },
        dress: { name: 'Kanchipuram Saree', caption: 'A heavy silk saree with rich gold zari work from the temple town of Kanchipuram.', image: 'dress.jpg' },
        festival: { name: 'Pongal', caption: 'A four-day harvest festival celebrating the Sun God and agricultural abundance.', image: 'festival.jpg' },
        food: { name: 'Idli', caption: 'Soft steamed rice cakes served with chutneys and sambar.', image: 'food.jpg' },
        heritage: { name: 'Meenakshi Temple', caption: 'A historic Hindu temple with towering gopurams adorned with thousands of sculptures.', image: 'heritage.jpg' },
    },
    Telangana: {
        dance: { name: 'Perini Dance', caption: 'An ancient warrior dance from the Kakatiya dynasty, revived as Telangana\'s state dance.', image: 'dance.jpg' },
        dress: { name: 'Pochampally Saree', caption: 'An ikat-weave silk saree from Pochampally, known for geometric patterns.', image: 'dress.jpg' },
        festival: { name: 'Bonalu', caption: 'A Hindu festival honoring goddess Mahakali with processions and ritual offerings.', image: 'festival.jpg' },
        food: { name: 'Hyderabadi Biryani', caption: 'An aromatic rice dish layered with spiced meat, saffron, and fried onions.', image: 'food.jpg' },
        heritage: { name: 'Charminar', caption: 'The iconic monument and mosque of Hyderabad, built in 1591.', image: 'heritage.jpg' },
    },
    Tripura: {
        dance: { name: 'Tripuri Dance', caption: 'Traditional dance forms of the Tripuri people, performed during community celebrations.', image: 'dance.jpg' },
        dress: { name: 'Rignai', caption: 'A traditional handwoven garment of Tripuri women with colorful patterns.', image: 'dress.jpg' },
        festival: { name: 'Kharchi Puja', caption: 'A royal festival of 14 gods with elaborate rituals and community participation.', image: 'festival.png' },
        food: { name: 'Tripuri Cuisine', caption: 'Cuisine featuring bamboo shoots, fermented fish, and locally foraged ingredients.', image: 'food.jpg' },
        heritage: { name: 'Ujjayanta Palace', caption: 'A grand royal palace built by Maharaja Radha Kishore Manikya, now a state museum.', image: 'heritage.jpg' },
    },
    'Uttar Pradesh': {
        dance: { name: 'Kathak', caption: 'A classical North Indian dance known for intricate footwork and expressive storytelling.', image: 'dance.jpg' },
        dress: { name: 'Chikankari', caption: 'Delicate hand-embroidery on fabric from Lucknow, known for floral patterns.', image: 'dress.jpg' },
        festival: { name: 'Kumbh Mela', caption: 'The world\'s largest religious gathering, held at sacred river confluences.', image: 'festival.jpg' },
        food: { name: 'Petha', caption: 'A translucent soft candy made from ash gourd, a sweet specialty of Agra.', image: 'food.jpg' },
        heritage: { name: 'Taj Mahal', caption: 'A UNESCO World Heritage Site and one of the Seven Wonders of the World.', image: 'heritage.jpg' },
    },
    Uttarakhand: {
        dance: { name: 'Garhwali Folk Dance', caption: 'Traditional folk dances of the Garhwal region performed during festivals.', image: 'dance.jpg' },
        dress: { name: 'Pahari Cap', caption: 'A traditional round cap worn as a symbol of identity in the hill regions.', image: 'dress.jpg' },
        festival: { name: 'Nanda Devi Raj Jat', caption: 'A legendary Himalayan pilgrimage held once every 12 years honoring Goddess Nanda Devi.', image: 'festival.jpg' },
        food: { name: 'Kumaoni Cuisine', caption: 'Mountain cuisine featuring lentils, grains, and locally foraged ingredients.', image: 'food.jpg' },
        heritage: { name: 'Kedarnath Temple', caption: 'One of the holiest Hindu shrines, located at 3,583m in the Himalayas.', image: 'heritage.jpg' },
    },
    'West Bengal': {
        dance: { name: 'Chhau Dance', caption: 'A semi-classical masked dance blending martial arts, tribal, and folk traditions.', image: 'dance.jpg' },
        dress: { name: 'Baluchari Saree', caption: 'A richly woven silk saree from Bishnupur with mythological narrative panels.', image: 'dress.jpg' },
        festival: { name: 'Durga Puja', caption: 'Bengal\'s grandest festival with elaborate pandals, art, and community celebration.', image: 'festival.jpg' },
        food: { name: 'Rasgulla', caption: 'Soft, spongy cheese balls soaked in light sugar syrup.', image: 'food.jpg' },
        heritage: { name: 'Howrah Bridge', caption: 'An iconic cantilever bridge over the Hooghly River, a defining landmark of Kolkata.', image: 'heritage.jpg' },
    },
};

const STATE_KEY_ALIASES = {
    'nct of delhi': 'Delhi',
    delhi: 'Delhi',
    'jammu and kashmir': 'Jammu and Kashmir',
    'jammu kashmir': 'Jammu and Kashmir',
    'jammu & kashmir': 'Jammu and Kashmir',
    'andaman and nicobar islands': 'Andaman and Nicobar',
    'andaman & nicobar islands': 'Andaman and Nicobar',
    'dadra and nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra and nagar haveli and daman and diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra & nagar haveli': 'Dadra and Nagar Haveli and Daman and Diu',
    'daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
    'dadra & nagar haveli and daman & diu': 'Dadra and Nagar Haveli and Daman and Diu',
    orissa: 'Odisha',
};

function normalizeStateKey(value) {
    return String(value || '')
        .toLowerCase()
        .replace(/&/g, ' and ')
        .replace(/[^a-z0-9]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const NORMALIZED_STATE_INDEX = Object.keys(CULTURAL_DATA).reduce(function buildIndex(acc, key) {
    acc[normalizeStateKey(key)] = key;
    return acc;
}, {});

function findStateContentKey(stateName) {
    const normalized = normalizeStateKey(stateName);
    if (!normalized) return null;
    const alias = STATE_KEY_ALIASES[normalized];
    return NORMALIZED_STATE_INDEX[normalized]
        || (alias ? NORMALIZED_STATE_INDEX[normalizeStateKey(alias)] : null)
        || null;
}

export function getCulturalContentForState(stateName) {
    const stateKey = findStateContentKey(stateName);
    const source = stateKey ? CULTURAL_DATA[stateKey] : null;
    const stateDisplayName = stateKey || String(stateName || '').trim() || 'Selected State';

    const categories = {};
    for (let i = 0; i < CULTURAL_CATEGORIES.length; i++) {
        const cat = CULTURAL_CATEGORIES[i];
        const entry = source?.[cat.id];
        categories[cat.id] = {
            title: entry?.name || cat.title,
            description: entry?.caption || '',
            image: entry?.image || '',
        };
    }

    const anchor = categories.dance.title !== 'Dance'
        ? categories.dance.title
        : categories.festival.title !== 'Festival'
            ? categories.festival.title
            : '';

    const intro = anchor
        ? `Featuring ${anchor} and four other cultural dimensions in ${stateDisplayName}.`
        : `A curated cultural snapshot of ${stateDisplayName} across dance, dress, festival, food, and heritage.`;

    return { stateDisplayName, stateKey: stateKey || '', intro, categories };
}
