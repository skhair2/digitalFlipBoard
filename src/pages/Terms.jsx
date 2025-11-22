import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'

export default function Terms() {
    return (
        <>
            <Helmet>
                <title>Terms of Service | FlipDisplay.online - Split-Flap Display Terms</title>
                <meta name="description" content="Read the terms and conditions for using FlipDisplay.online services. Comprehensive legal terms for our digital split-flap display platform." />
            </Helmet>

            <div className="min-h-screen bg-slate-900 py-12 px-4">
                <div className="container mx-auto max-w-4xl">
                    <div className="bg-slate-800/30 backdrop-blur rounded-2xl p-8 md:p-12 border border-slate-700">
                        <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">Terms of Service</h1>
                        <p className="text-gray-400 mb-8">Last updated: November 21, 2025</p>

                        <div className="prose prose-invert prose-lg max-w-none space-y-8 text-gray-300">
                            <section>
                                <p className="text-lg leading-relaxed">
                                    Welcome to FlipDisplay.online. These Terms of Service ("Terms") govern your access to and use of our web application, services, and features. By accessing or using FlipDisplay.online, you agree to be bound by these Terms.
                                </p>
                                <p className="mt-4 text-yellow-400 font-semibold">
                                    Please read these Terms carefully before using our service. If you do not agree to these Terms, you may not access or use FlipDisplay.online.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">1. Acceptance of Terms</h2>
                                <p>
                                    By creating an account, accessing our website, or using any of our services, you acknowledge that:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>You have read, understood, and agree to be bound by these Terms</li>
                                    <li>You have read and agree to our <Link to="/privacy" className="text-teal-400 hover:text-teal-300">Privacy Policy</Link></li>
                                    <li>You are at least 13 years of age (or the minimum age required in your jurisdiction)</li>
                                    <li>You have the legal capacity to enter into a binding agreement</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">2. Description of Service</h2>
                                <p>
                                    FlipDisplay.online is a web-based application that allows users to:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Create and display split-flap style message boards on any screen</li>
                                    <li>Control displays remotely through a controller interface</li>
                                    <li>Schedule messages for future display</li>
                                    <li>Customize animations, colors, and themes</li>
                                    <li>Manage multiple display boards (Pro plan)</li>
                                </ul>
                                <p className="mt-4">
                                    We reserve the right to modify, suspend, or discontinue any aspect of the service at any time, with or without notice.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">3. User Accounts</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.1 Account Creation</h3>
                                <p>To access certain features, you must create an account. You agree to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Provide accurate, current, and complete information</li>
                                    <li>Maintain and promptly update your account information</li>
                                    <li>Keep your password secure and confidential</li>
                                    <li>Notify us immediately of any unauthorized access</li>
                                    <li>Accept responsibility for all activities under your account</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">3.2 Account Termination</h3>
                                <p>We reserve the right to suspend or terminate your account if:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>You violate these Terms or our policies</li>
                                    <li>You engage in fraudulent or illegal activities</li>
                                    <li>Your account has been inactive for an extended period</li>
                                    <li>We are required to do so by law</li>
                                </ul>
                                <p className="mt-3">
                                    You may delete your account at any time through your account settings.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">4. Acceptable Use Policy</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.1 Permitted Use</h3>
                                <p>You may use FlipDisplay.online for lawful purposes, including:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Personal messaging and home displays</li>
                                    <li>Business communications and office displays</li>
                                    <li>Public information boards and announcements</li>
                                    <li>Creative and artistic projects</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">4.2 Prohibited Activities</h3>
                                <p>You agree NOT to:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Display illegal, harmful, threatening, abusive, or offensive content</li>
                                    <li>Violate any applicable laws, regulations, or third-party rights</li>
                                    <li>Impersonate any person or entity</li>
                                    <li>Transmit spam, malware, or malicious code</li>
                                    <li>Attempt to gain unauthorized access to our systems</li>
                                    <li>Interfere with or disrupt the service or servers</li>
                                    <li>Use automated systems to access the service without permission</li>
                                    <li>Reverse engineer, decompile, or disassemble our software</li>
                                    <li>Remove or modify any proprietary notices</li>
                                    <li>Use the service for competitive purposes</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">5. Content and Intellectual Property</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.1 Your Content</h3>
                                <p>You retain ownership of all content you create and display. By using our service, you grant us:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>A worldwide, non-exclusive license to host, store, and display your content</li>
                                    <li>The right to use your content solely to provide and improve our services</li>
                                    <li>Permission to create backups and derivative works for operational purposes</li>
                                </ul>
                                <p className="mt-3">
                                    You are solely responsible for your content and must ensure you have all necessary rights and permissions.
                                </p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">5.2 Our Intellectual Property</h3>
                                <p>FlipDisplay.online and all related materials are protected by intellectual property laws. This includes:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Software code, algorithms, and architecture</li>
                                    <li>User interface designs and animations</li>
                                    <li>Trademarks, logos, and branding</li>
                                    <li>Documentation and marketing materials</li>
                                </ul>
                                <p className="mt-3">
                                    You may not copy, modify, distribute, or create derivative works without our express written permission.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">6. Subscription and Payment</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.1 Free Plan</h3>
                                <p>Our free plan includes:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>One free session without sign-in</li>
                                    <li>Unlimited messages with account</li>
                                    <li>Basic features and animations</li>
                                    <li>One display board</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.2 Pro Plan</h3>
                                <p>Pro subscriptions are billed monthly at $4.99/month and include:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>All free plan features</li>
                                    <li>Scheduled messages</li>
                                    <li>Unlimited display boards</li>
                                    <li>Custom branding options</li>
                                    <li>API access</li>
                                    <li>Priority support</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">6.3 Billing and Cancellation</h3>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Subscriptions automatically renew unless cancelled</li>
                                    <li>You may cancel at any time; access continues until the end of the billing period</li>
                                    <li>No refunds for partial months or unused features</li>
                                    <li>We reserve the right to change pricing with 30 days notice</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">7. Disclaimers and Limitations of Liability</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.1 Service Availability</h3>
                                <p className="text-yellow-400">
                                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED.
                                </p>
                                <p className="mt-3">We do not guarantee that:</p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>The service will be uninterrupted, secure, or error-free</li>
                                    <li>Results obtained will be accurate or reliable</li>
                                    <li>Any errors or defects will be corrected</li>
                                </ul>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">7.2 Limitation of Liability</h3>
                                <p className="text-yellow-400">
                                    TO THE MAXIMUM EXTENT PERMITTED BY LAW, WE SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING LOSS OF PROFITS, DATA, OR USE.
                                </p>
                                <p className="mt-3">
                                    Our total liability shall not exceed the amount you paid us in the 12 months preceding the claim, or $100, whichever is greater.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">8. Indemnification</h2>
                                <p>
                                    You agree to indemnify, defend, and hold harmless FlipDisplay.online and its officers, directors, employees, and agents from any claims, damages, losses, liabilities, and expenses (including legal fees) arising from:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Your use of the service</li>
                                    <li>Your violation of these Terms</li>
                                    <li>Your violation of any rights of another party</li>
                                    <li>Your content or conduct</li>
                                </ul>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">9. Dispute Resolution</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">9.1 Informal Resolution</h3>
                                <p>
                                    Before filing a claim, you agree to contact us to attempt to resolve the dispute informally. We will work in good faith to resolve any issues.
                                </p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">9.2 Arbitration</h3>
                                <p>
                                    Any disputes that cannot be resolved informally shall be resolved through binding arbitration, except where prohibited by law. You waive your right to a jury trial or to participate in a class action.
                                </p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">9.3 Governing Law</h3>
                                <p>
                                    These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which we operate, without regard to conflict of law principles.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">10. Changes to Terms</h2>
                                <p>
                                    We may modify these Terms at any time. We will notify you of material changes by:
                                </p>
                                <ul className="list-disc pl-6 space-y-2 mt-3">
                                    <li>Posting the updated Terms on our website</li>
                                    <li>Updating the "Last updated" date</li>
                                    <li>Sending email notifications for significant changes</li>
                                </ul>
                                <p className="mt-3">
                                    Your continued use after changes become effective constitutes acceptance of the modified Terms.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">11. Miscellaneous</h2>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">11.1 Entire Agreement</h3>
                                <p>
                                    These Terms, together with our Privacy Policy, constitute the entire agreement between you and FlipDisplay.online.
                                </p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">11.2 Severability</h3>
                                <p>
                                    If any provision is found to be unenforceable, the remaining provisions will remain in full effect.
                                </p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">11.3 Waiver</h3>
                                <p>
                                    Our failure to enforce any right or provision shall not constitute a waiver of such right or provision.
                                </p>

                                <h3 className="text-xl font-semibold text-white mt-6 mb-3">11.4 Assignment</h3>
                                <p>
                                    You may not assign these Terms without our consent. We may assign our rights and obligations without restriction.
                                </p>
                            </section>

                            <section>
                                <h2 className="text-2xl font-bold text-white mt-8 mb-4">12. Contact Information</h2>
                                <p>
                                    For questions about these Terms, please contact us:
                                </p>
                                <div className="mt-4 p-4 bg-slate-700/50 rounded-lg">
                                    <p><strong>Email:</strong> <a href="mailto:legal@flipdisplay.online" className="text-teal-400 hover:text-teal-300">legal@flipdisplay.online</a></p>
                                    <p className="mt-2"><strong>Support:</strong> <Link to="/contact" className="text-teal-400 hover:text-teal-300">Contact Form</Link></p>
                                </div>
                            </section>

                            <section className="mt-12 pt-8 border-t border-slate-700">
                                <p className="text-sm text-gray-400">
                                    By using FlipDisplay.online, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                                </p>
                            </section>
                        </div>
                    </div>
                </div>
            </div>
        </>
    )
}
