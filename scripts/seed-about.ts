import { prisma } from "../lib/db/prisma";

function paragraphize(lines: string[]) {
  return lines.map((line) => `<p>${line}</p>`).join("");
}

async function main() {
  const storyZh = paragraphize([
    "Recipe Zen 诞生于一个简单的想法：如何将那些散落在广袤土地上的、令人心动的中国味道，带给世界各地的餐桌？",
    "我们的创始人 Evelyn 曾在海外生活多年，她深爱着家乡的食物，却发现在异国他乡很难找到一份地道且易懂的中式菜谱。与此同时，我们的美食探寻者 Wei 和 Sichen 正穿行于中国的街头巷尾：一个在川渝的麻辣中寻找灵感，一个在江南的清淡里品味四季。他们记录了无数濒临失传的风味，却苦于没有一个好的方式分享给世界。",
    "于是，我们走到了一起。我们中有对火候了如指掌的专业厨师，有严谨计算卡路里的营养师，还有用光影定格美味的摄影师。我们决定创建一个地方，不仅分享菜谱，更分享食物背后的文化、情感与温度。",
    "Recipe Zen 就是我们的答案。它始于团队成员对美食的热爱与足迹，最终回归于每一个普通人的厨房。我们相信，无论你身在何处，都能在这里找到那份治愈心灵的家乡味。",
  ]);

  const storyEn = paragraphize([
    "Recipe Zen was born from a simple question: how can we bring the unforgettable Chinese flavors scattered across a vast land to tables around the world?",
    "Our founder Evelyn lived abroad for many years. She loves the food of her hometown, yet found it hard to locate Chinese recipes that were both authentic and easy to follow. At the same time, our food explorers Wei and Sichen were walking the streets of China—one chasing the bold heat of Sichuan and Chongqing, the other savoring the seasonal lightness of Jiangnan. They documented countless regional flavors on the edge of disappearing, but lacked a way to share them with the world.",
    "So we came together. Among us are professional chefs who respect heat and timing, a dietitian who calculates nutrition with rigor, and a photographer who freezes flavor in light. We decided to build a place that shares not only recipes, but the culture, emotion, and warmth behind every dish.",
    "Recipe Zen is our answer. It starts with the footsteps of people who love food and returns to the kitchen of every ordinary home cook. We believe that no matter where you are, you can find a healing taste of home here.",
  ]);

  const teamZh = `
    <div id="team"></div>
    <p>我们是一群真心热爱做饭的人，也是一支专业而多元的团队。以下是陪你一起做饭的 7 位伙伴：</p>
    <div class="team-grid">
      <div class="team-member">
        <img class="team-avatar" src="/about/member_01_founder_chef.png" alt="林悦 / Evelyn Lin" />
        <h4>林悦 / Evelyn Lin</h4>
        <div class="team-role">创始人 & 主编 · Founder & Editor-in-Chief</div>
        <div class="team-signature">“食物是连接过去与未来的记忆。”</div>
        <div class="team-bio">曾在海外生活十余年，深知美食是慰藉乡愁的最好良药。她创立 Recipe Zen，希望用科技打破文化壁垒，让每一位海外游子和美食爱好者都能轻松做出地道的中国味。</div>
        <!-- Avatar prompt: Professional headshot of a 35-year-old elegant Chinese woman, founder of a food tech company, warm and confident smile. She is in a bright, modern office with bookshelves in the background. Natural window light, photorealistic, Sony A7 IV style. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_04_food_explorer.png" alt="李未 / Wei Li" />
        <h4>李未 / Wei Li</h4>
        <div class="team-role">美食探寻者 · Food Explorer</div>
        <div class="team-signature">“真正的美味藏在街头巷尾的烟火气里。”</div>
        <div class="team-bio">成都土著，一个为麻辣而生的男人。他痴迷于探索西南地区的民间风味，足迹遍布川渝云贵的山野与市集，致力于将最地道的烟火气带给世界。</div>
        <!-- Avatar prompt: Professional headshot of a 32-year-old Chinese man, a food explorer, friendly and curious expression, slightly tanned skin. He is standing in a bustling Chengdu street market, with blurred background of red lanterns and food stalls. Natural morning light, photorealistic, Canon EOS R5 style. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_03_content_editor.png" alt="陈思 / Sichen Chen" />
        <h4>陈思 / Sichen Chen</h4>
        <div class="team-role">美食探寻者 · Food Explorer</div>
        <div class="team-signature">“不时不食，每一口都是对自然的尊重。”</div>
        <div class="team-bio">来自苏州，一个典型的江南女子。她对食材的季节性变化极为敏感，擅长发掘江浙地区的清雅本味。她相信，最好的烹饪是顺应自然，呈现食材最本真的味道。</div>
        <!-- Avatar prompt: Candid photo of a 28-year-old gentle Chinese woman, food writer, smiling softly. She is walking through a lush green tea plantation in Hangzhou, holding a bamboo basket. Soft, diffused sunlight, film photography style, Fuji Pro 400H look. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/scene_01_cooking_kitchen.png" alt="张磊 / Leo Zhang" />
        <h4>张磊 / Leo Zhang</h4>
        <div class="team-role">专业厨师 · Professional Chef</div>
        <div class="team-signature">“厨房没有秘密，只有对火候和时间的敬畏。”</div>
        <div class="team-bio">拥有 20 年经验的鲁菜大厨，对北方面食和传统烹饪技法有深入研究。他确保 Recipe Zen 的每一份菜谱都严谨、可复现，让新手也能建立烹饪的信心。</div>
        <!-- Avatar prompt: Headshot of a 40-year-old strong Northern Chinese chef, serious but kind eyes, wearing a traditional white chef uniform. He is in a clean, professional kitchen, holding a rolling pin. Focused lighting, sharp details, photorealistic. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_05_product_manager.png" alt="梁浩 / Howard Leung" />
        <h4>梁浩 / Howard Leung</h4>
        <div class="team-role">专业厨师 · Professional Chef</div>
        <div class="team-signature">“好的料理，是食材与技艺的完美对话。”</div>
        <div class="team-bio">出生于香港厨师世家，曾在多家米其林餐厅工作。他精通粤菜，并热衷于融合创新。他为 Recipe Zen 带来了国际化的视野和对细节的极致追求。</div>
        <!-- Avatar prompt: Professional headshot of a 45-year-old Hong Kong chef, calm and confident expression, wearing a clean white chef's jacket. He is in a modern, stainless steel professional kitchen. Soft, focused lighting, Hasselblad camera style. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/scene_03_team_meeting.png" alt="王静 / Jessica Wang" />
        <h4>王静 / Jessica Wang</h4>
        <div class="team-role">注册营养师 · Registered Dietitian</div>
        <div class="team-signature">“吃得对，比吃得少更重要。”</div>
        <div class="team-bio">拥有美国注册营养师资质，她相信中式烹饪中蕴含着古老的营养智慧。她负责审核每道菜的营养信息，并提供专业的健康饮食建议。</div>
        <!-- Avatar prompt: Friendly headshot of a 30-year-old female Asian dietitian, wearing glasses and a lab coat, holding an apple. She is in a bright, clean clinic office. Approachable and professional look, photorealistic. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_02_photographer.png" alt="赵阳 / Sunny Zhao" />
        <h4>赵阳 / Sunny Zhao</h4>
        <div class="team-role">美食摄影师 · Food Photographer</div>
        <div class="team-signature">“用光影捕捉食物最诱人的瞬间。”</div>
        <div class="team-bio">一位对光线和构图有偏执追求的摄影师。他认为，一张好的美食照片能瞬间唤醒人的食欲。他为 Recipe Zen 的所有图片定下了“真实、温暖、有食欲”的视觉基调。</div>
        <!-- Avatar prompt: Candid photo of a 29-year-old male food photographer, focused expression, holding a camera. He is in a rustic photo studio, adjusting a dish on a wooden table. Side lighting from a large window, creating beautiful shadows, photorealistic. -->
      </div>
    </div>
  `.trim();

  const teamEn = `
    <div id="team"></div>
    <p>We are a team of genuine food lovers and professionals from different disciplines. Here are the seven people cooking alongside you:</p>
    <div class="team-grid">
      <div class="team-member">
        <img class="team-avatar" src="/about/member_01_founder_chef.png" alt="Evelyn Lin" />
        <h4>Evelyn Lin</h4>
        <div class="team-role">Founder & Editor-in-Chief</div>
        <div class="team-signature">“Food connects the past with the future.”</div>
        <div class="team-bio">She lived abroad for over a decade and knows how food can soothe homesickness. Evelyn founded Recipe Zen to break cultural barriers with technology so that anyone can cook authentic Chinese dishes with ease.</div>
        <!-- Avatar prompt: Professional headshot of a 35-year-old elegant Chinese woman, founder of a food tech company, warm and confident smile. She is in a bright, modern office with bookshelves in the background. Natural window light, photorealistic, Sony A7 IV style. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_04_food_explorer.png" alt="Wei Li" />
        <h4>Wei Li</h4>
        <div class="team-role">Food Explorer</div>
        <div class="team-signature">“Real flavor lives in the smoke and bustle of the streets.”</div>
        <div class="team-bio">Born in Chengdu, he is a man made for spice. Wei explores folk flavors across Sichuan, Chongqing, Yunnan, and Guizhou, bringing the most authentic street-side dishes to the world.</div>
        <!-- Avatar prompt: Professional headshot of a 32-year-old Chinese man, a food explorer, friendly and curious expression, slightly tanned skin. He is standing in a bustling Chengdu street market, with blurred background of red lanterns and food stalls. Natural morning light, photorealistic, Canon EOS R5 style. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_03_content_editor.png" alt="Sichen Chen" />
        <h4>Sichen Chen</h4>
        <div class="team-role">Food Explorer</div>
        <div class="team-signature">“Seasonal eating is respect for nature in every bite.”</div>
        <div class="team-bio">From Suzhou, she is attuned to the rhythm of ingredients and seasons. Sichen highlights the clean, delicate flavors of Jiangnan and believes the best cooking honors the ingredient’s true essence.</div>
        <!-- Avatar prompt: Candid photo of a 28-year-old gentle Chinese woman, food writer, smiling softly. She is walking through a lush green tea plantation in Hangzhou, holding a bamboo basket. Soft, diffused sunlight, film photography style, Fuji Pro 400H look. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/scene_01_cooking_kitchen.png" alt="Leo Zhang" />
        <h4>Leo Zhang</h4>
        <div class="team-role">Professional Chef</div>
        <div class="team-signature">“There are no secrets in the kitchen—only respect for heat and time.”</div>
        <div class="team-bio">With 20 years of experience in Lu cuisine, Leo specializes in northern dough techniques and traditional methods. He ensures every Recipe Zen recipe is rigorous and repeatable for beginners.</div>
        <!-- Avatar prompt: Headshot of a 40-year-old strong Northern Chinese chef, serious but kind eyes, wearing a traditional white chef uniform. He is in a clean, professional kitchen, holding a rolling pin. Focused lighting, sharp details, photorealistic. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_05_product_manager.png" alt="Howard Leung" />
        <h4>Howard Leung</h4>
        <div class="team-role">Professional Chef</div>
        <div class="team-signature">“Great cooking is a conversation between ingredient and craft.”</div>
        <div class="team-bio">Born into a Hong Kong chef family and trained in Michelin kitchens, Howard is a Cantonese expert who loves innovation. He brings an international lens and a sharp eye for detail.</div>
        <!-- Avatar prompt: Professional headshot of a 45-year-old Hong Kong chef, calm and confident expression, wearing a clean white chef's jacket. He is in a modern, stainless steel professional kitchen. Soft, focused lighting, Hasselblad camera style. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/scene_03_team_meeting.png" alt="Jessica Wang" />
        <h4>Jessica Wang</h4>
        <div class="team-role">Registered Dietitian</div>
        <div class="team-signature">“Eating right matters more than eating less.”</div>
        <div class="team-bio">A U.S.-registered dietitian, she believes traditional Chinese cooking holds deep nutritional wisdom. Jessica reviews nutrition data and offers professional guidance for healthier eating.</div>
        <!-- Avatar prompt: Friendly headshot of a 30-year-old female Asian dietitian, wearing glasses and a lab coat, holding an apple. She is in a bright, clean clinic office. Approachable and professional look, photorealistic. -->
      </div>
      <div class="team-member">
        <img class="team-avatar" src="/about/member_02_photographer.png" alt="Sunny Zhao" />
        <h4>Sunny Zhao</h4>
        <div class="team-role">Food Photographer</div>
        <div class="team-signature">“Light is how we capture food at its most irresistible.”</div>
        <div class="team-bio">A photographer obsessed with light and composition, Sunny believes a great food photo can awaken appetite instantly. He set the visual tone for Recipe Zen as “real, warm, and crave-worthy.”</div>
        <!-- Avatar prompt: Candid photo of a 29-year-old male food photographer, focused expression, holding a camera. He is in a rustic photo studio, adjusting a dish on a wooden table. Side lighting from a large window, creating beautiful shadows, photorealistic. -->
      </div>
    </div>
  `.trim();

  const philosophyZh = `
    <div class="philosophy-section">
      <h4>我们坚持免费</h4>
      <p>因为我们的初衷就是分享。我们希望无论你来自何方，经济状况如何，都能无门槛地享受到烹饪的乐趣和中国美食的魅力。</p>
    </div>
    <div class="philosophy-section">
      <h4>我们追求治愈</h4>
      <p>我们相信烹饪是最好的疗愈。当 Evelyn 在异乡复刻家乡味，当 Wei 在旅途中被一碗热汤温暖，我们都感受到了食物的力量。我们希望通过温暖的图片和贴心的指导，让你在厨房的方寸之间，找到内心的宁静。</p>
    </div>
    <div class="philosophy-section">
      <h4>我们用心对待每一餐</h4>
      <p>每一份食谱，都经过了我们探寻者的发掘、厨师团队的反复测试和营养师的审核。我们用心，因为我们知道，你正在用我们的菜谱，为你所爱的人做一顿饭。这份信任，值得我们全力以赴。</p>
    </div>
  `.trim();

  const philosophyEn = `
    <div class="philosophy-section">
      <h4>We Insist on Being Free</h4>
      <p>Sharing is our starting point. We want everyone—no matter where they live or what their budget is—to enjoy the joy of cooking and the charm of Chinese cuisine without barriers.</p>
    </div>
    <div class="philosophy-section">
      <h4>We Pursue Healing</h4>
      <p>We believe cooking is the best kind of therapy. When Evelyn recreated a taste of home abroad, and when Wei was warmed by a bowl of soup on the road, we felt food’s power. We hope our warm imagery and thoughtful guidance help you find calm in the kitchen.</p>
    </div>
    <div class="philosophy-section">
      <h4>We Treat Every Meal with Heart</h4>
      <p>Every recipe goes through our explorers’ discoveries, repeated testing by chefs, and review by our dietitian. We care because we know you are cooking for the people you love—and that trust deserves our best.</p>
    </div>
  `.trim();

  const sections = [
    {
      titleZh: "我们的故事：始于足下，归于厨房",
      titleEn: "Our Story: A Journey from the World to the Kitchen",
      contentZh: storyZh,
      contentEn: storyEn,
      type: "image",
      imageUrl: "/about/scene_05_farmers_market.png",
      videoUrl: null,
      sortOrder: 0,
    },
    {
      titleZh: "我们的团队：一群用心做饭的美食家",
      titleEn: "Our Team: People Who Cook with Heart",
      contentZh: teamZh,
      contentEn: teamEn,
      type: "text",
      imageUrl: null,
      videoUrl: null,
      sortOrder: 1,
    },
    {
      titleZh: "我们的理念：免费、治愈、用心",
      titleEn: "Our Philosophy: Free, Healing, and Heartfelt",
      contentZh: philosophyZh,
      contentEn: philosophyEn,
      type: "text",
      imageUrl: null,
      videoUrl: null,
      sortOrder: 2,
    },
  ];

  await prisma.aboutSection.deleteMany();

  for (const section of sections) {
    await prisma.aboutSection.create({
      data: {
        titleZh: section.titleZh,
        contentZh: section.contentZh,
        type: section.type,
        imageUrl: section.imageUrl,
        videoUrl: section.videoUrl,
        sortOrder: section.sortOrder,
        isActive: true,
        translations: {
          create: [
            {
              locale: "en",
              title: section.titleEn,
              content: section.contentEn,
            },
          ],
        },
      },
    });
  }

  console.log("About sections seeded:", sections.length);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });