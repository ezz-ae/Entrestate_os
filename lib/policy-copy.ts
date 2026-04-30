import { type AppLocale } from "@/i18n/locale"
import type { PolicyDocument } from "@/components/policy-page"

function privacyPolicy(locale: AppLocale): Omit<PolicyDocument, "footerLink"> {
  if (locale === "ar") {
    return {
      eyebrow: "الخصوصية",
      title: "سياسة الخصوصية",
      subtitle: "آخر تحديث: مارس 2026",
      intro:
        "هذه الصفحة تشرح كيف تتعامل Entrestate مع بيانات الحساب، واستخدام المنصة، وطلبات الدعم، ومخرجات الأدوات. الهدف بسيط: تشغيل الخدمة بثقة، مع أقل قدر ممكن من جمع البيانات، وبما ينسجم مع توقعات PDPL في الإمارات وGDPR عند انطباقه.",
      sections: [
        {
          title: "ما الذي نجمعه",
          paragraphs: [
            "نجمع البيانات التي يحتاجها تشغيل الحساب والخدمة: الاسم، البريد الإلكتروني، اسم الشركة إن وجد، وسجل الدخول الأساسي.",
            "كما نحتفظ بإشارات استخدام مرتبطة بتشغيل المنصة مثل الصفحات المفتوحة، الطلبات المنفذة، وأخطاء النظام، حتى نتمكن من المتابعة والتحسين وحماية الخدمة.",
          ],
        },
        {
          title: "لماذا نستخدم هذه البيانات",
          paragraphs: [
            "نستخدم البيانات لتشغيل الحساب، تأمين الوصول، معالجة الاشتراك والدفع، إرسال التنبيهات المهمة، وتحسين جودة التجربة اليومية داخل المنصة.",
          ],
          bullets: [
            "تفعيل الحساب وتسجيل الدخول بأمان",
            "تشغيل الأدوات والتقارير ولوحات السوق",
            "متابعة المشكلات والدعم الفني",
            "قياس الجودة والاعتمادية على مستوى المنصة",
          ],
        },
        {
          title: "كيف نتعامل مع الطلبات داخل المنصة",
          paragraphs: [
            "عند استخدامك للمساعد أو أدوات السوق، يتم تمرير الطلبات داخل بيئة التشغيل اللازمة لإرجاع النتيجة. هذه الطلبات قد تُخزَّن لفترة محدودة لأغراض المتابعة الفنية ومنع إساءة الاستخدام وتحسين الاعتمادية.",
            "لا نستخدم مدخلاتك لتدريب أنظمة خارجية دون أساس تعاقدي واضح أو موافقة صريحة عندما تكون مطلوبة.",
          ],
        },
        {
          title: "متى قد نشارك البيانات",
          paragraphs: [
            "لا نبيع بياناتك الشخصية. وقد نشارك بيانات محددة فقط عند الحاجة التشغيلية أو النظامية، مثل مزودي الدفع والاستضافة والتحليلات أو إذا طُلب ذلك وفق التزام قانوني واضح.",
            "كما ننشر صفحة عامة بالمزودين التشغيليين الذين يساعدون في تشغيل الخدمة حتى يبقى سطح المعالجة واضحاً قبل التعاقد أو الاعتماد.",
          ],
        },
        {
          title: "الحماية والاحتفاظ",
          paragraphs: [
            "نطبّق ضوابط وصول وتشفير ومراقبة تشغيلية تتناسب مع طبيعة الخدمة والبيانات. كما تختلف مدد الاحتفاظ بحسب نوع البيانات والغرض التشغيلي أو المتطلبات القانونية المرتبطة بها.",
          ],
        },
        {
          title: "حقوقك وكيف تتواصل معنا",
          paragraphs: [
            "إذا رغبت في تصحيح بياناتك أو طلب حذفها أو الاستفسار عن أي نقطة تخص الخصوصية، يمكنك التواصل معنا عبر صفحة التواصل أو فريق الدعم، وسنراجع الطلب وفق طبيعة الحساب والالتزامات النظامية القائمة.",
            "وعند انطباقه، يهدف هذا المسار إلى تغطية طلبات الوصول والتصحيح والحذف والاعتراض المرتبطة بـ PDPL وGDPR.",
          ],
        },
      ],
      footerNote: "للاطلاع على شروط استخدام المنصة، راجع",
    }
  }

  return {
    eyebrow: "Privacy",
    title: "Privacy Policy",
    subtitle: "Last updated: March 2026",
    intro:
      "This page explains how Entrestate handles account data, platform activity, support requests, and product outputs. It is written to align the live product surface with UAE PDPL and GDPR-style privacy expectations while keeping collection limited to what is required to operate the service.",
    sections: [
      {
        title: "What we collect",
        paragraphs: [
          "We collect the information needed to run your account and service access, including your name, email, company details where relevant, and core sign-in records.",
          "We also retain operational signals tied to platform use such as page activity, submitted requests, and system errors so we can monitor quality, support users, and protect the service.",
        ],
      },
      {
        title: "Why we use it",
        paragraphs: ["We use data to operate accounts, secure access, process subscriptions, send important notices, and improve daily product performance."],
        bullets: [
          "Account access and authentication",
          "Product delivery across dashboards, reports, and tools",
          "Support and troubleshooting",
          "Quality and reliability monitoring",
        ],
      },
      {
        title: "How product requests are handled",
        paragraphs: [
          "When you use assistants or market tools, requests are processed inside the runtime needed to return your result. Logs may be retained for a limited period for abuse prevention, debugging, and reliability review.",
          "We do not use your inputs to train external systems without a clear contractual basis or explicit consent where required.",
        ],
      },
      {
        title: "When data may be shared",
        paragraphs: [
          "We do not sell personal information. Limited sharing may happen with payment, hosting, and analytics providers, or where disclosure is required by law or valid legal process.",
          "A public list of the operational subprocessors used to run the service is published on the Entrestate subprocessor page.",
        ],
      },
      {
        title: "Security and retention",
        paragraphs: [
          "We apply access controls, encryption, and operational monitoring aligned with the platform's data sensitivity. Retention periods vary by dataset type and legal or operational purpose.",
        ],
      },
      {
        title: "Your choices",
        paragraphs: [
          "If you want to correct, delete, or review your information, contact our support team through the platform contact page and we will review the request against active account and legal obligations.",
          "Where applicable, this process is intended to support PDPL- and GDPR-style access, correction, deletion, and objection requests.",
        ],
      },
    ],
    footerNote: "For platform usage terms, see",
  }
}

function termsOfService(locale: AppLocale): Omit<PolicyDocument, "footerLink"> {
  if (locale === "ar") {
    return {
      eyebrow: "الشروط",
      title: "شروط الاستخدام",
      subtitle: "آخر تحديث: مارس 2026",
      intro:
        "تحدد هذه الصفحة إطار استخدام Entrestate، سواء كنت تتصفح السوق، تعتمد على أدوات القرار، أو تستخدم الخدمة ضمن فريق أو حساب مؤسسي. استخدام المنصة يعني التزامك بهذه الشروط وبالسياسات المرتبطة بها.",
      sections: [
        {
          title: "نطاق الخدمة",
          paragraphs: [
            "توفر Entrestate لوحات سوق، أدوات فحص ومقارنة، ومحتوى تحليلي يساعد على فهم السوق واتخاذ القرار. المنصة تقدم بيانات وإشارات وأدوات عمل، لكنها لا تمثل توصية استثمارية شخصية أو التزامًا بنتيجة بعينها.",
          ],
        },
        {
          title: "الحساب والمسؤولية",
          paragraphs: [
            "أنت مسؤول عن دقة البيانات التي تضيفها إلى الحساب، وعن حماية وسائل الدخول الخاصة بك، وعن أي نشاط يتم من خلال حسابك ما لم تبلغنا عن إساءة أو اختراق بشكل واضح وفي الوقت المناسب.",
          ],
        },
        {
          title: "الاشتراك والدفع",
          paragraphs: [
            "بعض أجزاء الخدمة تتطلب اشتراكًا مدفوعًا أو صلاحيات محددة. عند الاشتراك، توافق على الرسوم المعلنة للدورة المختارة، وعلى معالجة الدفع وفق الشروط التجارية والضريبية المرتبطة بالحساب أو المنطقة.",
          ],
        },
        {
          title: "الاستخدام المقبول",
          paragraphs: [
            "لا يجوز استخدام المنصة في نسخ البيانات بشكل جماعي خارج الصلاحيات، أو محاولة تعطيل الخدمة، أو تجاوز الضوابط التقنية، أو إعادة بيع المحتوى أو التقارير أو الواجهات دون موافقة صريحة.",
          ],
          bullets: [
            "عدم إساءة استخدام الواجهات أو محاولات التحايل",
            "عدم إعادة نشر المحتوى المحمي دون إذن",
            "عدم استخدام الحساب بما يضر سلامة الخدمة أو باقي المستخدمين",
          ],
        },
        {
          title: "حدود الاعتماد",
          paragraphs: [
            "نحرص على أن تكون البيانات محدثة ومنظمة، لكن السوق متحرك بطبيعته. قد تتغير الأسعار والتغطية وتوافر المشاريع والمطورين. لذلك تبقى مسؤولية القرار النهائي على المستخدم أو الجهة التي تعتمد على المخرجات.",
          ],
        },
        {
          title: "الإيقاف أو الإنهاء",
          paragraphs: [
            "قد نعلّق الحساب أو نوقفه إذا كان هناك إخلال واضح بالشروط، أو إساءة استخدام للخدمة، أو خطر تشغيلي أو قانوني. كما يمكنك إيقاف الاستخدام أو إلغاء الاشتراك وفق المسار المتاح في الحساب أو عبر فريق الدعم.",
          ],
        },
      ],
      footerNote: "ولمعرفة كيف نتعامل مع بياناتك، راجع",
    }
  }

  return {
    eyebrow: "Terms",
    title: "Terms of Service",
    subtitle: "Last updated: March 2026",
    intro:
      "This page defines the framework for using Entrestate, whether you access market dashboards, decision tools, or enterprise workflows. By using the platform, you agree to these terms and the related policies.",
    sections: [
      {
        title: "Service scope",
        paragraphs: [
          "Entrestate provides market dashboards, screening and comparison tools, and analytical content that supports market understanding and decision workflows. The platform does not provide personal investment advice or guarantee a specific outcome.",
        ],
      },
      {
        title: "Account responsibility",
        paragraphs: [
          "You are responsible for the accuracy of information added to your account, for safeguarding credentials, and for activity that occurs through the account unless you notify us promptly about misuse or compromise.",
        ],
      },
      {
        title: "Subscriptions and billing",
        paragraphs: [
          "Some parts of the service require paid access or specific permissions. By subscribing, you agree to the listed fees for the selected term and to payment handling under the commercial and tax rules applicable to your account.",
        ],
      },
      {
        title: "Acceptable use",
        paragraphs: [
          "You may not extract data at scale outside granted rights, disrupt the service, bypass technical controls, or redistribute reports, datasets, or interfaces without explicit permission.",
        ],
        bullets: [
          "No abusive API or scraping behavior",
          "No unauthorized republication of protected content",
          "No use that harms platform stability or other users",
        ],
      },
      {
        title: "Reliance and limitations",
        paragraphs: [
          "We work to keep data current and organized, but market conditions change continuously. Prices, coverage, project availability, and developer information may shift over time, so final reliance remains with the user or organization making the decision.",
        ],
      },
      {
        title: "Suspension or termination",
        paragraphs: [
          "We may suspend or terminate access in cases of clear policy breach, abusive use, or legal or operational risk. You may also stop using the service or cancel eligible subscriptions through the account workflow or support team.",
        ],
      },
    ],
    footerNote: "To understand how we handle your data, see",
  }
}

function cookiePolicy(locale: AppLocale): PolicyDocument {
  if (locale === "ar") {
    return {
      eyebrow: "الكوكيز",
      title: "سياسة ملفات الارتباط",
      subtitle: "آخر تحديث: مارس 2026",
      intro:
        "نستخدم ملفات الارتباط وبعض تقنيات التخزين المشابهة حتى تبقى الجلسة مستقرة، وتُحفظ تفضيلاتك، وتُقاس جودة الاستخدام على مستوى المنصة. لا نستخدمها كطبقة تسويقية عشوائية، بل كجزء من تشغيل الخدمة وتحسينها.",
      sections: [
        {
          title: "لماذا نستخدمها",
          paragraphs: [
            "تساعدنا ملفات الارتباط في تذكر الجلسة، وحفظ الإعدادات المختارة، وقراءة المؤشرات العامة التي تشرح كيف تُستخدم المنصة، حتى نحافظ على تجربة مستقرة وواضحة من زيارة إلى أخرى.",
          ],
        },
        {
          title: "الملفات الضرورية",
          paragraphs: [
            "هذه الملفات مرتبطة بالدخول، الأمان، واستمرارية الجلسة. إيقافها قد يمنع بعض أجزاء المنصة من العمل بشكل صحيح، خصوصًا الحساب، الجلسات المحمية، ومسارات الدفع.",
          ],
        },
        {
          title: "ملفات القياس والتحسين",
          paragraphs: [
            "نستخدم إشارات مجمعة لفهم الأعطال، قياس الأداء، ومعرفة أين يحتاج المنتج إلى تحسين. الهدف هنا تشغيلي وتحسيني، لا تتبع سلوكي مبالغ فيه.",
          ],
        },
        {
          title: "ملفات التفضيلات",
          paragraphs: [
            "تُستخدم لحفظ اختيارات مثل اللغة وبعض إعدادات الواجهة، بحيث لا تبدأ التجربة من الصفر في كل مرة تعود فيها إلى المنصة.",
          ],
        },
        {
          title: "كيف تتحكم بها",
          paragraphs: [
            "يمكنك إدارة ملفات الارتباط من خلال إعدادات المتصفح. لكن حذف الملفات الضرورية أو تعطيلها قد يؤثر في تسجيل الدخول، استمرارية الجلسة، وبعض المسارات المحمية داخل الحساب.",
          ],
        },
      ],
    }
  }

  return {
    eyebrow: "Cookies",
    title: "Cookie Policy",
    subtitle: "Last updated: March 2026",
    intro:
      "We use cookies and related browser storage to keep sessions stable, remember settings, and measure product quality across the platform. They support service operation rather than broad marketing tracking.",
    sections: [
      {
        title: "Why we use them",
        paragraphs: [
          "Cookies help us keep sessions active, preserve user settings, and read aggregate product signals so the platform stays stable and improves over time.",
        ],
      },
      {
        title: "Essential cookies",
        paragraphs: [
          "These support authentication, security, and session continuity. Disabling them may prevent account access, protected workflows, or payment-related flows from working correctly.",
        ],
      },
      {
        title: "Analytics and performance",
        paragraphs: [
          "We use aggregate signals to understand failures, performance bottlenecks, and product behavior. The purpose is operational improvement, not excessive behavioral tracking.",
        ],
      },
      {
        title: "Preference cookies",
        paragraphs: [
          "These store choices such as language and interface preferences so the experience does not reset every time you return to the platform.",
        ],
      },
      {
        title: "Managing cookies",
        paragraphs: [
          "You can manage cookies through browser settings. Removing essential cookies may affect sign-in, session continuity, and protected account workflows.",
        ],
      },
    ],
  }
}

function dataUsage(locale: AppLocale): PolicyDocument {
  if (locale === "ar") {
    return {
      eyebrow: "البيانات",
      title: "كيف نتعامل مع بيانات السوق",
      subtitle: "آخر تحديث: مارس 2026",
      intro:
        "هذه الصفحة تشرح كيف تنتقل بيانات السوق داخل Entrestate من المصدر إلى الواجهة: من الجمع والتنظيم، إلى الفحص، ثم النشر داخل اللوحات، الصفحات، والتقارير. الغاية هي الوضوح، لا الإبهار المصطلحي.",
      sections: [
        {
          title: "مصادر البيانات",
          paragraphs: [
            "تعتمد المنصة على مصادر تشغيلية متعددة مثل تغذيات القوائم، سجلات السوق، إفصاحات المطورين، ومخرجات التنظيم الداخلي. لكل طبقة مصدرها وسياقها وحدودها، ولا نتعامل معها كلها باعتبارها متساوية في الثقة أو التغطية.",
          ],
        },
        {
          title: "كيف تتحول البيانات إلى كيان واضح",
          paragraphs: [
            "قبل ظهور البيانات للمستخدم، تمر عبر مراحل تنظيف وربط وتوحيد أسماء المشاريع والمطورين والمناطق، ثم تُربط بطبقات التقييم والمقارنة. هذا يقلل الازدواجية ويجعل المخرجات قابلة للمراجعة لاحقًا.",
          ],
        },
        {
          title: "طبقات القياس والإشارات",
          paragraphs: [
            "بعض الأرقام تأتي كما هي من المصدر، وبعضها ناتج عن قواعد اشتقاق واضحة مثل التصنيف، التوقيت، أو فحوص الثقة. الإشارات التي نظهرها يجب أن تمر بضوابط اكتمال واتساق قبل أن تُنشر للمستخدم.",
          ],
        },
        {
          title: "الثقة وحدود النشر",
          paragraphs: [
            "إذا كانت التغطية ناقصة أو حداثة البيانات ضعيفة أو الربط غير موثوق بما يكفي، قد نخفض مستوى الثقة أو نمتنع عن إظهار جزء من المعلومة. الهدف ألا تبدو المنصة واثقة عندما لا ينبغي لها ذلك.",
          ],
        },
        {
          title: "الوصول والاحتفاظ",
          paragraphs: [
            "يختلف الاحتفاظ بحسب نوع البيانات وحساسيتها. كما أن الوصول إلى بعض الطبقات يظل محصورًا بالأدوار والعمليات المخولة فقط، مع تسجيل تشغيلي يوضح من وصل إلى ماذا ومتى عند الحاجة.",
          ],
        },
      ],
    }
  }

  return {
    eyebrow: "Data",
    title: "How market data is handled",
    subtitle: "Last updated: March 2026",
    intro:
      "This page explains how market data moves through Entrestate from source to interface: collection, normalization, validation, and publication across dashboards, pages, and reports.",
    sections: [
      {
        title: "Sources",
        paragraphs: [
          "The platform relies on multiple operational inputs including listing feeds, market records, developer disclosures, and internal normalization layers. Each source has its own context, limitations, and confidence profile.",
        ],
      },
      {
        title: "From raw feed to usable entity",
        paragraphs: [
          "Before data reaches users, it passes through cleaning, matching, and normalization so projects, developers, and areas appear as coherent entities. This reduces duplication and keeps outputs reviewable.",
        ],
      },
      {
        title: "Metrics and signals",
        paragraphs: [
          "Some values are published directly from a source, while others are derived from deterministic rules such as classification, timing, and confidence checks. Signals must pass quality controls before publication.",
        ],
      },
      {
        title: "Confidence and publication limits",
        paragraphs: [
          "If coverage is incomplete, freshness is weak, or the linkage is not reliable enough, confidence may be reduced or some information may be withheld. The aim is to avoid false precision.",
        ],
      },
      {
        title: "Access and retention",
        paragraphs: [
          "Retention depends on dataset type and sensitivity. Access to some layers is limited to authorized roles and processes, with operational logging for accountability where needed.",
        ],
      },
    ],
  }
}

export function getPrivacyPolicy(locale: AppLocale, links: { termsHref: string }): PolicyDocument {
  return {
    ...privacyPolicy(locale),
    footerLink: {
      href: links.termsHref,
      label: locale === "ar" ? "شروط الاستخدام" : "Terms of Service",
    },
  }
}

export function getTermsOfService(locale: AppLocale, links: { privacyHref: string }): PolicyDocument {
  return {
    ...termsOfService(locale),
    footerLink: {
      href: links.privacyHref,
      label: locale === "ar" ? "سياسة الخصوصية" : "Privacy Policy",
    },
  }
}

export function getCookiePolicy(locale: AppLocale): PolicyDocument {
  return cookiePolicy(locale)
}

export function getDataUsage(locale: AppLocale): PolicyDocument {
  return dataUsage(locale)
}
