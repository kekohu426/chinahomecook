export interface TagItem {
    id: string; // 原始ID，不一定入库，主要用于参考
    nameZh: string;
    nameEn: string;
    slug: string;
    description: string;
    sort: number;
}

export interface TagCategory {
    type: string; // 对应数据库 Tag.type
    nameZh: string;
    items: TagItem[];
}

export const tagCategories: TagCategory[] = [
    // 一、场景分类 -> type: "scene"
    {
        type: "scene",
        nameZh: "场景",
        items: [
            { id: "scene-01", nameZh: "早餐", nameEn: "Breakfast", slug: "breakfast", description: "营养美味的中式早餐食谱...", sort: 1 },
            { id: "scene-02", nameZh: "午餐", nameEn: "Lunch", slug: "lunch", description: "丰富的中式午餐菜谱...", sort: 2 },
            { id: "scene-03", nameZh: "晚餐", nameEn: "Dinner", slug: "dinner", description: "精选晚餐菜谱...", sort: 3 },
            { id: "scene-04", nameZh: "下午茶", nameEn: "Afternoon Tea", slug: "afternoon-tea", description: "适合下午茶时光的中式点心...", sort: 4 },
            { id: "scene-05", nameZh: "夜宵", nameEn: "Late Night Snack", slug: "late-night-snack", description: "深夜食堂美食推荐...", sort: 5 },
            { id: "scene-06", nameZh: "便当", nameEn: "Bento", slug: "bento", description: "适合带饭的便当菜谱...", sort: 6 },
            { id: "scene-07", nameZh: "快手菜", nameEn: "Quick Dish", slug: "quick-dish", description: "15分钟快速出锅...", sort: 7 },
            { id: "scene-08", nameZh: "懒人菜", nameEn: "Lazy Cooking", slug: "lazy-cooking", description: "一锅出、免看守...", sort: 8 },
            { id: "scene-09", nameZh: "下酒菜", nameEn: "Drinking Snack", slug: "drinking-snack", description: "经典下酒菜谱...", sort: 9 },
            { id: "scene-10", nameZh: "下饭菜", nameEn: "Rice Pairing", slug: "rice-pairing", description: "超级下饭的家常菜谱...", sort: 10 },
            { id: "scene-11", nameZh: "减脂餐", nameEn: "Weight Loss Meal", slug: "weight-loss-meal", description: "低卡高蛋白的减肥食谱...", sort: 11 },
            { id: "scene-12", nameZh: "健身餐", nameEn: "Fitness Meal", slug: "fitness-meal", description: "适合健身人群...", sort: 12 },
            { id: "scene-13", nameZh: "儿童餐", nameEn: "Kids Meal", slug: "kids-meal", description: "营养美味的儿童食谱...", sort: 13 },
            { id: "scene-14", nameZh: "月子餐", nameEn: "Postpartum Meal", slug: "postpartum-meal", description: "科学营养的月子食谱...", sort: 14 },
            { id: "scene-15", nameZh: "老人餐", nameEn: "Senior Meal", slug: "senior-meal", description: "适合老年人的养生食谱...", sort: 15 }
        ]
    },

    // 二、烹饪方法分类 -> type: "method"
    {
        type: "method",
        nameZh: "烹饪方法",
        items: [
            { id: "method-01", nameZh: "炒", nameEn: "Stir-Fry", slug: "stir-fry", description: "经典炒菜做法大全...", sort: 1 },
            { id: "method-02", nameZh: "蒸", nameEn: "Steam", slug: "steam", description: "健康清蒸菜谱...", sort: 2 },
            { id: "method-03", nameZh: "炖", nameEn: "Stew", slug: "stew", description: "营养炖汤和炖菜食谱...", sort: 3 },
            { id: "method-04", nameZh: "烤", nameEn: "Bake/Roast", slug: "bake-roast", description: "家用烤箱和空气炸锅...", sort: 4 },
            { id: "method-05", nameZh: "煮", nameEn: "Boil", slug: "boil", description: "清煮、白煮类...", sort: 5 },
            { id: "method-06", nameZh: "煎", nameEn: "Pan-Fry", slug: "pan-fry", description: "香煎菜谱...", sort: 6 },
            { id: "method-07", nameZh: "炸", nameEn: "Deep-Fry", slug: "deep-fry", description: "油炸美食做法...", sort: 7 },
            { id: "method-08", nameZh: "烧", nameEn: "Braise", slug: "braise", description: "红烧、干烧等...", sort: 8 },
            { id: "method-09", nameZh: "焖", nameEn: "Simmer", slug: "simmer", description: "焖菜做法...", sort: 9 },
            { id: "method-10", nameZh: "拌", nameEn: "Toss/Mix", slug: "toss-mix", description: "凉拌菜食谱...", sort: 10 },
            { id: "method-11", nameZh: "卤", nameEn: "Braise in Soy Sauce", slug: "braise-in-soy-sauce", description: "卤味制作大全...", sort: 11 },
            { id: "method-12", nameZh: "煲", nameEn: "Soup Pot", slug: "soup-pot", description: "广式煲汤食谱...", sort: 12 },
            { id: "method-13", nameZh: "炝", nameEn: "Quick-Fry", slug: "quick-fry", description: "热油激发香味...", sort: 13 },
            { id: "method-14", nameZh: "腌", nameEn: "Pickle/Marinate", slug: "pickle-marinate", description: "腌制菜谱...", sort: 14 },
            { id: "method-15", nameZh: "熏", nameEn: "Smoke", slug: "smoke", description: "家庭熏制方法...", sort: 15 },
            { id: "method-16", nameZh: "凉拌", nameEn: "Cold Dish", slug: "cold-dish", description: "快手凉拌菜...", sort: 16 },
            { id: "method-17", nameZh: "烙", nameEn: "Griddle", slug: "griddle", description: "烙饼、烙馍等...", sort: 17 },
            { id: "method-18", nameZh: "扒", nameEn: "Sauté", slug: "saute", description: "扒制菜肴...", sort: 18 },
            { id: "method-19", nameZh: "爆", nameEn: "Quick-Blast", slug: "quick-blast", description: "爆炒技法...", sort: 19 },
            { id: "method-20", nameZh: "醉", nameEn: "Wine-Soaked", slug: "wine-soaked", description: "醉鸡、醉虾等...", sort: 20 }
        ]
    },

    // 三、口味分类 -> type: "taste" (注意：user说 'category-flavor', 但DB里是 'taste')
    {
        type: "taste",
        nameZh: "口味",
        items: [
            { id: "flavor-01", nameZh: "咸香", nameEn: "Savory", slug: "savory", description: "经典咸香口味...", sort: 1 },
            { id: "flavor-02", nameZh: "麻辣", nameEn: "Spicy", slug: "spicy", description: "川菜麻辣风味...", sort: 2 },
            { id: "flavor-03", nameZh: "香辣", nameEn: "Hot & Spicy", slug: "hot-spicy", description: "香辣浓郁的湘菜...", sort: 3 },
            { id: "flavor-04", nameZh: "酸辣", nameEn: "Sour & Spicy", slug: "sour-spicy", description: "酸辣开胃菜谱...", sort: 4 },
            { id: "flavor-05", nameZh: "糖醋", nameEn: "Sweet & Sour", slug: "sweet-sour", description: "糖醋味经典菜肴...", sort: 5 },
            { id: "flavor-06", nameZh: "清淡", nameEn: "Light", slug: "light", description: "清淡少油...", sort: 6 },
            { id: "flavor-07", nameZh: "鲜香", nameEn: "Umami", slug: "umami", description: "鲜味浓郁...", sort: 7 },
            { id: "flavor-08", nameZh: "甜味", nameEn: "Sweet", slug: "sweet", description: "甜味菜肴...", sort: 8 },
            { id: "flavor-09", nameZh: "咸鲜", nameEn: "Salty & Fresh", slug: "salty-fresh", description: "咸鲜适口...", sort: 9 },
            { id: "flavor-10", nameZh: "酱香", nameEn: "Sauce Flavor", slug: "sauce-flavor", description: "酱料调味...", sort: 10 },
            { id: "flavor-11", nameZh: "蒜香", nameEn: "Garlic Flavor", slug: "garlic-flavor", description: "蒜香浓郁...", sort: 11 },
            { id: "flavor-12", nameZh: "椒盐", nameEn: "Salt & Pepper", slug: "salt-pepper", description: "椒盐风味...", sort: 12 },
            { id: "flavor-13", nameZh: "孜然", nameEn: "Cumin", slug: "cumin", description: "孜然香料...", sort: 13 },
            { id: "flavor-14", nameZh: "五香", nameEn: "Five-Spice", slug: "five-spice", description: "传统五香卤味...", sort: 14 },
            { id: "flavor-15", nameZh: "葱香", nameEn: "Scallion Flavor", slug: "scallion-flavor", description: "葱香味菜肴...", sort: 15 },
            { id: "flavor-16", nameZh: "姜味", nameEn: "Ginger Flavor", slug: "ginger-flavor", description: "姜香驱寒...", sort: 16 },
            { id: "flavor-17", nameZh: "酒香", nameEn: "Wine Aroma", slug: "wine-aroma", description: "黄酒、料酒...", sort: 17 },
            { id: "flavor-18", nameZh: "茶香", nameEn: "Tea Flavor", slug: "tea-flavor", description: "茶叶入菜...", sort: 18 },
            { id: "flavor-19", nameZh: "烟熏", nameEn: "Smoky", slug: "smoky", description: "烟熏风味...", sort: 19 },
            { id: "flavor-20", nameZh: "清爽", nameEn: "Refreshing", slug: "refreshing", description: "清爽开胃...", sort: 20 }
        ]
    },

    // 四、适宜人群分类 -> type: "crowd" (注意：user说 'category-suitable-for', DB里是 'crowd')
    {
        type: "crowd",
        nameZh: "适宜人群",
        items: [
            { id: "suitable-01", nameZh: "孕妇", nameEn: "Pregnant Women", slug: "pregnant-women", description: "适合孕期...", sort: 1 },
            { id: "suitable-02", nameZh: "产妇", nameEn: "Postpartum Women", slug: "postpartum-women", description: "月子期营养...", sort: 2 },
            { id: "suitable-03", nameZh: "儿童", nameEn: "Children", slug: "children", description: "营养美味的儿童...", sort: 3 },
            { id: "suitable-04", nameZh: "老人", nameEn: "Seniors", slug: "seniors", description: "适合老年人...", sort: 4 },
            { id: "suitable-05", nameZh: "糖尿病", nameEn: "Diabetes", slug: "diabetes", description: "糖尿病患者...", sort: 5 },
            { id: "suitable-06", nameZh: "高血压", nameEn: "Hypertension", slug: "hypertension", description: "高血压人群...", sort: 6 },
            { id: "suitable-07", nameZh: "贫血", nameEn: "Anemia", slug: "anemia", description: "补血养血...", sort: 7 },
            { id: "suitable-08", nameZh: "痛风", nameEn: "Gout", slug: "gout", description: "痛风患者...", sort: 8 },
            { id: "suitable-09", nameZh: "肠胃不好", nameEn: "Digestive Issues", slug: "digestive-issues", description: "养胃护胃...", sort: 9 },
            { id: "suitable-10", nameZh: "便秘", nameEn: "Constipation", slug: "constipation", description: "缓解便秘...", sort: 10 },
            { id: "suitable-11", nameZh: "减肥人群", nameEn: "Weight Loss", slug: "weight-loss", description: "低卡高蛋白...", sort: 11 },
            { id: "suitable-12", nameZh: "健身人群", nameEn: "Fitness", slug: "fitness", description: "健身增肌...", sort: 12 },
            { id: "suitable-13", nameZh: "上班族", nameEn: "Office Workers", slug: "office-workers", description: "适合上班族...", sort: 13 },
            { id: "suitable-14", nameZh: "学生", nameEn: "Students", slug: "students", description: "学生营养...", sort: 14 },
            { id: "suitable-15", nameZh: "素食者", nameEn: "Vegetarians", slug: "vegetarians", description: "素食主义者...", sort: 15 },
            { id: "suitable-16", nameZh: "过敏体质", nameEn: "Allergies", slug: "allergies", description: "针对食物过敏...", sort: 16 },
            { id: "suitable-17", nameZh: "肾病", nameEn: "Kidney Disease", slug: "kidney-disease", description: "肾病患者...", sort: 17 },
            { id: "suitable-18", nameZh: "脂肪肝", nameEn: "Fatty Liver", slug: "fatty-liver", description: "脂肪肝人群...", sort: 18 },
            { id: "suitable-19", nameZh: "感冒咳嗽", nameEn: "Cold & Cough", slug: "cold-cough", description: "感冒期间...", sort: 19 },
            { id: "suitable-20", nameZh: "熬夜人群", nameEn: "Night Owls", slug: "night-owls", description: "适合熬夜...", sort: 20 }
        ]
    },

    // 五、场合分类 -> type: "occasion"
    {
        type: "occasion",
        nameZh: "场合",
        items: [
            { id: "occasion-01", nameZh: "家常菜", nameEn: "Home Cooking", slug: "home-cooking", description: "日常家庭...", sort: 1 },
            { id: "occasion-02", nameZh: "宴客菜", nameEn: "Banquet Dish", slug: "banquet-dish", description: "招待客人...", sort: 2 },
            { id: "occasion-03", nameZh: "春节", nameEn: "Chinese New Year", slug: "chinese-new-year", description: "春节年夜饭...", sort: 3 },
            { id: "occasion-04", nameZh: "中秋节", nameEn: "Mid-Autumn Festival", slug: "mid-autumn-festival", description: "中秋团圆...", sort: 4 },
            { id: "occasion-05", nameZh: "端午节", nameEn: "Dragon Boat Festival", slug: "dragon-boat-festival", description: "端午节传统...", sort: 5 },
            { id: "occasion-06", nameZh: "元宵节", nameEn: "Lantern Festival", slug: "lantern-festival", description: "元宵节传统...", sort: 6 },
            { id: "occasion-07", nameZh: "清明节", nameEn: "Qingming Festival", slug: "qingming-festival", description: "清明时节...", sort: 7 },
            { id: "occasion-08", nameZh: "重阳节", nameEn: "Double Ninth Festival", slug: "double-ninth-festival", description: "重阳节养生...", sort: 8 },
            { id: "occasion-09", nameZh: "生日宴", nameEn: "Birthday Party", slug: "birthday-party", description: "生日庆典...", sort: 9 },
            { id: "occasion-10", nameZh: "婚宴", nameEn: "Wedding Banquet", slug: "wedding-banquet", description: "婚宴菜谱...", sort: 10 },
            { id: "occasion-11", nameZh: "满月酒", nameEn: "Full Month Celebration", slug: "full-month-celebration", description: "满月宴...", sort: 11 },
            { id: "occasion-12", nameZh: "聚餐", nameEn: "Gathering", slug: "gathering", description: "朋友聚餐...", sort: 12 },
            { id: "occasion-13", nameZh: "野餐", nameEn: "Picnic", slug: "picnic", description: "户外野餐...", sort: 13 },
            { id: "occasion-14", nameZh: "烧烤", nameEn: "BBQ", slug: "bbq", description: "户外烧烤...", sort: 14 },
            { id: "occasion-15", nameZh: "火锅", nameEn: "Hot Pot", slug: "hot-pot", description: "家庭火锅...", sort: 15 },
            { id: "occasion-16", nameZh: "下午茶", nameEn: "Afternoon Tea", slug: "afternoon-tea-occasion", description: "精致下午茶...", sort: 16 },
            { id: "occasion-17", nameZh: "看球赛", nameEn: "Watch Sports", slug: "watch-sports", description: "看球必备...", sort: 17 },
            { id: "occasion-18", nameZh: "追剧", nameEn: "Binge-Watching", slug: "binge-watching", description: "追剧小零食...", sort: 18 },
            { id: "occasion-19", nameZh: "周末", nameEn: "Weekend", slug: "weekend", description: "周末家庭大餐...", sort: 19 },
            { id: "occasion-20", nameZh: "纪念日", nameEn: "Anniversary", slug: "anniversary", description: "纪念日浪漫...", sort: 20 }
        ]
    }
];
