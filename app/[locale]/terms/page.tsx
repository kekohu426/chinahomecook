/**
 * 使用条款页面
 * 路由：/terms
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

interface TermsPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Terms of Use | Recipe Zen" : "使用条款 | Recipe Zen",
    description: isEn
      ? "Terms of use for Recipe Zen. Learn the rules and conditions of using this site."
      : "Recipe Zen 使用条款，了解使用本网站的规则和条件。",
  };
}

export default async function TermsPage({ params }: TermsPageProps) {
  const { locale } = await params;
  const isEn = locale === "en";
  const lastUpdated = isEn ? "December 31, 2024" : "2024年12月31日";

  return (
    <div className="min-h-screen bg-cream">
      <Header />

      <main className="max-w-4xl mx-auto px-4 sm:px-8 py-8 sm:py-12">
        {/* 面包屑导航 */}
        <nav className="flex items-center gap-2 text-sm text-textGray mb-6">
          <LocalizedLink href="/" className="hover:text-brownWarm transition-colors">
            {isEn ? "Home" : "首页"}
          </LocalizedLink>
          <ChevronRight className="w-4 h-4" />
          <span className="text-textDark">
            {isEn ? "Terms of Use" : "使用条款"}
          </span>
        </nav>

        <article className="bg-white rounded-xl p-6 sm:p-10 shadow-sm">
          <h1 className="text-3xl font-serif font-medium text-textDark mb-4">
            {isEn ? "Terms of Use" : "使用条款"}
          </h1>
          <p className="text-sm text-textGray mb-8">
            {isEn ? "Last updated: " : "最后更新："}
            {lastUpdated}
          </p>

          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-textDark prose-p:text-textGray prose-li:text-textGray">
            <p>
              {isEn
                ? 'Welcome to Recipe Zen ("the site"). Before using any services, please read these terms carefully. By using the site, you agree to comply with these terms.'
                : '欢迎使用 Recipe Zen（以下简称"本网站"）。在使用本网站提供的任何服务之前，请仔细阅读以下使用条款。使用本网站即表示您同意遵守这些条款。'}
            </p>

            <h2>{isEn ? "1. Services" : "一、服务说明"}</h2>
            <p>{isEn ? "Recipe Zen is a food recipe platform that provides:" : "Recipe Zen 是一个美食食谱平台，提供以下服务："}</p>
            <ul>
              <li>
                <strong>{isEn ? "Recipe browsing" : "食谱浏览"}</strong>
                {isEn ? ": curated recipes and cooking guides." : "：浏览各类精选食谱和烹饪指南"}
              </li>
              <li>
                <strong>{isEn ? "AI custom recipes" : "AI 定制食谱"}</strong>
                {isEn ? ": personalized recipes based on your ingredients and preferences." : "：根据您的食材和偏好生成个性化食谱"}
              </li>
              <li>
                <strong>{isEn ? "Food blog" : "美食博客"}</strong>
                {isEn ? ": articles and insights about food." : "：阅读美食相关的文章和资讯"}
              </li>
              <li>
                <strong>{isEn ? "Food gallery" : "美食图库"}</strong>
                {isEn ? ": curated food photography." : "：欣赏精美的美食摄影作品"}
              </li>
            </ul>

            <h2>{isEn ? "2. User Conduct" : "二、用户行为规范"}</h2>
            <p>{isEn ? "When using the site, you agree to:" : "在使用本网站时，您同意："}</p>
            <ul>
              <li>{isEn ? "Comply with applicable laws and regulations." : "遵守中华人民共和国相关法律法规"}</li>
              <li>{isEn ? "Not post illegal, harmful, threatening, or abusive content." : "不发布违法、有害、威胁性、侮辱性的内容"}</li>
              <li>{isEn ? "Not infringe others' intellectual property or lawful rights." : "不侵犯他人的知识产权或其他合法权益"}</li>
              <li>{isEn ? "Not engage in actions that disrupt site operations." : "不进行任何可能损害网站正常运行的行为"}</li>
              <li>{isEn ? "Not use automated tools to scrape content in bulk." : "不使用自动化工具大量抓取网站内容"}</li>
              <li>{isEn ? "Not attempt unauthorized access to systems or user data." : "不尝试未经授权访问网站系统或用户数据"}</li>
            </ul>

            <h2>{isEn ? "3. AI Content Disclaimer" : "三、AI 生成内容免责声明"}</h2>
            <p>{isEn ? "Some recipes are generated with AI. Please note:" : "本网站使用人工智能技术生成部分食谱内容。关于 AI 生成内容，请注意："}</p>
            <ul>
              <li>
                <strong>{isEn ? "For reference" : "仅供参考"}</strong>
                {isEn
                  ? ": AI recipes are for reference. Adjust based on your experience and situation."
                  : "：AI 生成的食谱仅供参考，实际烹饪时请根据个人经验和实际情况调整"}
              </li>
              <li>
                <strong>{isEn ? "Ingredient safety" : "食材安全"}</strong>
                {isEn
                  ? ": confirm freshness, allergens, and safety yourself. AI cannot assess your health conditions."
                  : "：请自行确认食材的新鲜度、过敏原和食用安全性，AI 无法判断您的具体健康状况和过敏情况"}
              </li>
              <li>
                <strong>{isEn ? "Nutrition" : "营养信息"}</strong>
                {isEn
                  ? ": nutritional data is estimated. Consult a professional if you have special dietary needs."
                  : "：AI 提供的营养信息为估算值，如有特殊饮食需求请咨询专业营养师"}
              </li>
              <li>
                <strong>{isEn ? "Cooking safety" : "烹饪技巧"}</strong>
                {isEn
                  ? ": beginners should cook under guidance, especially with high heat or open flames."
                  : "：建议初学者在有经验的人指导下进行烹饪，特别是涉及高温、明火等操作"}
              </li>
            </ul>

            <h2>{isEn ? "4. Intellectual Property" : "四、知识产权"}</h2>
            <h3>{isEn ? "4.1 Site content" : "4.1 网站内容"}</h3>
            <p>
              {isEn
                ? "The design, text, images, and code are protected by intellectual property laws. You may not copy, modify, distribute, or use them commercially without permission."
                : "本网站的设计、文字、图片、代码等内容受知识产权法保护。未经授权，不得复制、修改、传播或用于商业目的。"}
            </p>

            <h3>{isEn ? "4.2 User-generated content" : "4.2 用户生成内容"}</h3>
            <p>
              {isEn
                ? "You retain rights to content you create (e.g., custom recipes), but grant us a non-exclusive license to display and promote it on the site."
                : "对于您通过本网站创建的内容（如自定义食谱），您保留相关权利，但同时授予我们在本网站展示和推广该内容的非独占许可。"}
            </p>

            <h3>{isEn ? "4.3 Third-party content" : "4.3 第三方内容"}</h3>
            <p>
              {isEn
                ? "The site may include links to third-party sites. We are not responsible for their content; please follow their terms."
                : "本网站可能包含指向第三方网站的链接。我们不对第三方网站的内容负责，访问第三方网站时请遵守其相应的使用条款。"}
            </p>

            <h2>{isEn ? "5. Account Responsibility" : "五、账户责任"}</h2>
            <p>{isEn ? "If you create an account:" : "如果您创建了账户："}</p>
            <ul>
              <li>{isEn ? "You are responsible for keeping your account secure." : "您有责任保护账户的安全性"}</li>
              <li>{isEn ? "Do not share your credentials with others." : "不得与他人共享账户凭证"}</li>
              <li>{isEn ? "Notify us immediately if your account is compromised." : "发现账户被盗用应立即通知我们"}</li>
              <li>{isEn ? "You are responsible for activities under your account." : "您对账户下的所有活动负责"}</li>
            </ul>

            <h2>{isEn ? "6. Service Changes and Termination" : "六、服务变更与终止"}</h2>
            <p>{isEn ? "We reserve the right to:" : "我们保留以下权利："}</p>
            <ul>
              <li>{isEn ? "Modify, suspend, or terminate services at any time." : "随时修改、暂停或终止任何服务功能"}</li>
              <li>{isEn ? "Restrict or terminate access for violations." : "因违反条款而限制或终止用户的访问权限"}</li>
              <li>{isEn ? "Remove content that violates these terms when necessary." : "在必要时删除违规内容"}</li>
            </ul>
            <p>
              {isEn
                ? "We will try to notify you of major changes in advance, but urgent situations may not allow prior notice."
                : "我们会尽量提前通知重大变更，但紧急情况下可能无法提前通知。"}
            </p>

            <h2>{isEn ? "7. Disclaimers" : "七、免责声明"}</h2>
            <ul>
              <li>
                {isEn
                  ? 'The site is provided "as is" without warranties of any kind.'
                  : '本网站按"现状"提供，不提供任何明示或暗示的保证'}
              </li>
              <li>
                {isEn
                  ? "We do not guarantee uninterrupted or error-free service."
                  : "我们不保证服务不会中断或完全没有错误"}
              </li>
              <li>
                {isEn
                  ? "We are not liable for any direct or indirect loss from using recipes on this site."
                  : "对于因使用本网站食谱导致的任何直接或间接损失，我们不承担责任"}
              </li>
              <li>
                {isEn
                  ? "If you have food allergies or medical conditions, consult a doctor before using any recipe."
                  : "如有食物过敏、特殊疾病等情况，请在使用食谱前咨询医生"}
              </li>
            </ul>

            <h2>{isEn ? "8. Limitation of Liability" : "八、责任限制"}</h2>
            <p>
              {isEn
                ? "To the maximum extent permitted by law, Recipe Zen and its operators are not liable for:"
                : "在法律允许的最大范围内，Recipe Zen 及其运营方不对以下情况承担责任："}
            </p>
            <ul>
              <li>{isEn ? "Service interruptions due to force majeure." : "因不可抗力导致的服务中断"}</li>
              <li>{isEn ? "Losses caused by user actions." : "因用户自身原因导致的损失"}</li>
              <li>{isEn ? "Losses caused by third parties." : "因第三方行为导致的损失"}</li>
              <li>{isEn ? "Any indirect, incidental, or punitive damages." : "任何间接性、附带性、惩罚性损失"}</li>
            </ul>

            <h2>{isEn ? "9. Changes to Terms" : "九、条款修改"}</h2>
            <p>
              {isEn
                ? "We may update these terms from time to time. Updates will be posted on this page. Continued use of the site indicates acceptance."
                : "我们可能会不时修改本使用条款。修改后的条款将在本页面发布。继续使用本网站即表示您接受修改后的条款。"}
            </p>

            <h2>{isEn ? "10. Governing Law and Disputes" : "十、法律适用与争议解决"}</h2>
            <p>
              {isEn
                ? "These terms are governed by the laws of the People's Republic of China. Disputes should be resolved through friendly negotiation; otherwise, either party may bring a lawsuit to a court with jurisdiction."
                : "本条款受中华人民共和国法律管辖。因本条款引起的任何争议，双方应友好协商解决；协商不成的，任何一方可向有管辖权的人民法院提起诉讼。"}
            </p>

            <h2>{isEn ? "11. Contact" : "十一、联系方式"}</h2>
            <p>
              {isEn
                ? "If you have questions about these terms, please contact us:"
                : "如果您对本使用条款有任何疑问，请联系我们："}
            </p>
            <ul>
              <li>{isEn ? "Email: support@recipezen.com" : "邮箱：support@recipezen.com"}</li>
            </ul>
          </div>
        </article>

        {/* 相关链接 */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <LocalizedLink
            href="/privacy"
            className="text-textGray hover:text-brownWarm transition-colors"
          >
            {isEn ? "Privacy Policy" : "隐私政策"}
          </LocalizedLink>
          <span className="text-lightGray">|</span>
          <LocalizedLink
            href="/copyright"
            className="text-textGray hover:text-brownWarm transition-colors"
          >
            {isEn ? "Copyright" : "版权声明"}
          </LocalizedLink>
          <span className="text-lightGray">|</span>
          <LocalizedLink
            href="/about"
            className="text-textGray hover:text-brownWarm transition-colors"
          >
            {isEn ? "About" : "关于我们"}
          </LocalizedLink>
        </div>
      </main>

      <Footer />
    </div>
  );
}
