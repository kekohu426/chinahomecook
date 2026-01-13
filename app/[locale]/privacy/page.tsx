/**
 * 隐私政策页面
 * 路由：/privacy
 */

import { LocalizedLink } from "@/components/i18n/LocalizedLink";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { ChevronRight } from "lucide-react";
import type { Metadata } from "next";
import type { Locale } from "@/lib/i18n/config";

interface PrivacyPageProps {
  params: Promise<{ locale: Locale }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const isEn = locale === "en";
  return {
    title: isEn ? "Privacy Policy | Recipe Zen" : "隐私政策 | Recipe Zen",
    description: isEn
      ? "Learn how Recipe Zen collects, uses, and protects your personal information."
      : "Recipe Zen 隐私政策，了解我们如何收集、使用和保护您的个人信息。",
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
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
            {isEn ? "Privacy Policy" : "隐私政策"}
          </span>
        </nav>

        <article className="bg-white rounded-xl p-6 sm:p-10 shadow-sm">
          <h1 className="text-3xl font-serif font-medium text-textDark mb-4">
            {isEn ? "Privacy Policy" : "隐私政策"}
          </h1>
          <p className="text-sm text-textGray mb-8">
            {isEn ? "Last updated: " : "最后更新："}
            {lastUpdated}
          </p>

          <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-textDark prose-p:text-textGray prose-li:text-textGray">
            <p>
              {isEn
                ? 'Welcome to Recipe Zen ("we" or "the site"). We value your privacy and will do our best to protect your personal information. This policy explains how we collect, use, store, and protect your information.'
                : '欢迎使用 Recipe Zen（以下简称"我们"或"本网站"）。我们深知个人信息对您的重要性，' +
                  "并会尽全力保护您的隐私安全。本隐私政策旨在帮助您了解我们如何收集、使用、存储和保护您的个人信息。"}
            </p>

            <h2>{isEn ? "1. Information Collection" : "一、信息收集"}</h2>
            <p>{isEn ? "We may collect the following types of information:" : "我们可能收集以下类型的信息："}</p>

            <h3>{isEn ? "1.1 Information you provide" : "1.1 您主动提供的信息"}</h3>
            <ul>
              <li>
                <strong>{isEn ? "Account information" : "账户信息"}</strong>
                {isEn
                  ? ": username, email, and other details when you register."
                  : "：当您注册账户时，我们会收集您的用户名、电子邮箱等信息"}
              </li>
              <li>
                <strong>{isEn ? "Recipe preferences" : "食谱偏好"}</strong>
                {isEn
                  ? ": ingredient preferences, taste preferences, dietary restrictions for AI custom recipes."
                  : "：您使用 AI 定制食谱功能时输入的食材偏好、口味喜好、饮食限制等"}
              </li>
              <li>
                <strong>{isEn ? "Feedback" : "反馈信息"}</strong>
                {isEn
                  ? ": comments, suggestions, or support requests you submit."
                  : "：您提交的评论、建议或问题反馈"}
              </li>
            </ul>

            <h3>{isEn ? "1.2 Information collected automatically" : "1.2 自动收集的信息"}</h3>
            <ul>
              <li>
                <strong>{isEn ? "Device information" : "设备信息"}</strong>
                {isEn ? ": device type, operating system, browser type." : "：设备类型、操作系统、浏览器类型"}
              </li>
              <li>
                <strong>{isEn ? "Log information" : "日志信息"}</strong>
                {isEn ? ": visit time, pages viewed, time spent." : "：访问时间、浏览页面、停留时长"}
              </li>
              <li>
                <strong>{isEn ? "Cookie information" : "Cookie 信息"}</strong>
                {isEn ? ": used to remember your preferences and login status." : "：用于记住您的偏好设置和登录状态"}
              </li>
            </ul>

            <h2>{isEn ? "2. How We Use Information" : "二、信息使用"}</h2>
            <p>{isEn ? "We use the information for the following purposes:" : "我们收集的信息将用于以下目的："}</p>
            <ul>
              <li>{isEn ? "Provide, maintain, and improve our services." : "提供、维护和改进我们的服务"}</li>
              <li>{isEn ? "Generate personalized AI recipe recommendations." : "为您生成个性化的 AI 食谱推荐"}</li>
              <li>{isEn ? "Analyze site usage to improve user experience." : "分析网站使用情况以优化用户体验"}</li>
              <li>{isEn ? "Send service-related notifications when necessary." : "发送服务相关的通知（如有必要）"}</li>
              <li>{isEn ? "Prevent fraud and ensure site security." : "防止欺诈和确保网站安全"}</li>
            </ul>

            <h2>{isEn ? "3. AI-Generated Content" : "三、AI 生成内容说明"}</h2>
            <p>{isEn ? "This site uses AI to generate recipe content. Please note:" : "本网站使用人工智能技术生成食谱内容。请注意："}</p>
            <ul>
              <li>{isEn ? "AI-generated recipes are for reference; adjust as needed." : "AI 生成的食谱仅供参考，请根据实际情况调整"}</li>
              <li>{isEn ? "Your ingredient preferences may be used to personalize content." : "您输入的食材偏好等信息会被用于生成个性化内容"}</li>
              <li>{isEn ? "We do not use your personal preferences to train AI models." : "我们不会将您的个人偏好数据用于训练 AI 模型"}</li>
              <li>{isEn ? "AI content may contain errors; please judge food safety yourself." : "AI 生成的内容可能存在误差，请自行判断食材安全性"}</li>
            </ul>

            <h2>{isEn ? "4. Information Sharing" : "四、信息共享"}</h2>
            <p>{isEn ? "We do not sell your personal information. We may share information only when:" : "我们不会出售您的个人信息。仅在以下情况下可能共享信息："}</p>
            <ul>
              <li>{isEn ? "You provide explicit consent." : "获得您的明确同意"}</li>
              <li>{isEn ? "Required by laws or government authorities." : "法律法规要求或政府部门依法要求"}</li>
              <li>{isEn ? "With trusted service providers (e.g., cloud storage) who agree to this policy." : "与可信赖的服务提供商合作（如云存储服务），且他们同意遵守本隐私政策"}</li>
            </ul>

            <h2>{isEn ? "5. Information Security" : "五、信息安全"}</h2>
            <p>{isEn ? "We take reasonable technical and administrative measures to protect your information, including:" : "我们采取合理的技术和管理措施保护您的信息安全，包括但不限于："}</p>
            <ul>
              <li>{isEn ? "HTTPS encryption for data transmission." : "使用 HTTPS 加密传输数据"}</li>
              <li>{isEn ? "Encrypted storage for sensitive data." : "对敏感信息进行加密存储"}</li>
              <li>{isEn ? "Regular security audits and vulnerability scanning." : "定期安全审计和漏洞检测"}</li>
              <li>{isEn ? "Access controls for employee data access." : "限制员工访问用户数据的权限"}</li>
            </ul>

            <h2>{isEn ? "6. Cookies" : "六、Cookie 使用"}</h2>
            <p>{isEn ? "We use cookies and similar technologies to:" : "我们使用 Cookie 和类似技术来："}</p>
            <ul>
              <li>{isEn ? "Remember your login status." : "记住您的登录状态"}</li>
              <li>{isEn ? "Save your browsing preferences." : "保存您的浏览偏好"}</li>
              <li>{isEn ? "Analyze site traffic and usage." : "分析网站流量和使用情况"}</li>
            </ul>
            <p>
              {isEn
                ? "You can manage or delete cookies in your browser settings, but this may affect certain features."
                : "您可以通过浏览器设置管理或删除 Cookie，但这可能影响某些功能的正常使用。"}
            </p>

            <h2>{isEn ? "7. Your Rights" : "七、您的权利"}</h2>
            <p>{isEn ? "You have the following rights regarding your personal information:" : "您对个人信息享有以下权利："}</p>
            <ul>
              <li>
                <strong>{isEn ? "Access" : "访问权"}</strong>
                {isEn ? ": view your personal information we hold." : "：查看我们持有的您的个人信息"}
              </li>
              <li>
                <strong>{isEn ? "Correction" : "更正权"}</strong>
                {isEn ? ": request corrections to inaccurate information." : "：要求更正不准确的个人信息"}
              </li>
              <li>
                <strong>{isEn ? "Deletion" : "删除权"}</strong>
                {isEn ? ": request deletion of your personal information." : "：要求删除您的个人信息"}
              </li>
              <li>
                <strong>{isEn ? "Withdraw consent" : "撤回同意"}</strong>
                {isEn ? ": withdraw consent you previously provided." : "：撤回之前给予的同意"}
              </li>
            </ul>
            <p>
              {isEn
                ? "To exercise these rights, please contact us using the information at the bottom of this page."
                : "如需行使上述权利，请通过本页面底部的联系方式与我们联系。"}
            </p>

            <h2>{isEn ? "8. Minors" : "八、未成年人保护"}</h2>
            <p>
              {isEn
                ? "Our services are intended for adults. If you are under 18, please use the site with a guardian's supervision."
                : "我们的服务主要面向成年人。如果您是未满 18 周岁的未成年人，请在监护人的陪同和指导下使用本网站。"}
            </p>

            <h2>{isEn ? "9. Policy Updates" : "九、政策更新"}</h2>
            <p>
              {isEn
                ? 'We may update this policy from time to time. Updates will be posted here and the "Last updated" date will change. For significant changes, we will provide notices on the site.'
                : '我们可能会不时更新本隐私政策。更新后的政策将在本页面发布，并更新"最后更新"日期。重大变更时，我们会通过网站公告等方式通知您。'}
            </p>

            <h2>{isEn ? "10. Contact Us" : "十、联系我们"}</h2>
            <p>
              {isEn
                ? "If you have any questions or suggestions about this policy, please contact us:"
                : "如果您对本隐私政策有任何疑问、意见或建议，请通过以下方式联系我们："}
            </p>
            <ul>
              <li>{isEn ? "Email: privacy@recipezen.com" : "邮箱：privacy@recipezen.com"}</li>
            </ul>
          </div>
        </article>

        {/* 相关链接 */}
        <div className="mt-8 flex flex-wrap gap-4 justify-center text-sm">
          <LocalizedLink
            href="/terms"
            className="text-textGray hover:text-brownWarm transition-colors"
          >
            {isEn ? "Terms" : "使用条款"}
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
