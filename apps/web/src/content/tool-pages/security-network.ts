import { toolPage } from "./shared";

export const securityNetworkToolPages = [
  toolPage({
    slug: "dns-lookup",
    seoTitle: { ru: "DNS Lookup — проверка DNS-записей", en: "DNS Lookup — DNS Records Checker" },
    metaDescription: { ru: "Проверьте A, AAAA, CNAME, MX, NS и TXT записи домена без URL-сканирования.", en: "Check A, AAAA, CNAME, MX, NS, and TXT records for a domain without URL crawling." },
    h1: { ru: "Проверка DNS-записей", en: "DNS Records Lookup" },
    lead: { ru: "Введите домен, чтобы получить bounded DNS lookup по ключевым типам записей и рекомендации по базовой DNS-гигиене.", en: "Enter a domain to run a bounded DNS lookup across key record types and get baseline DNS hygiene guidance." },
    quickFacts: [
      { ru: "A / AAAA", en: "A / AAAA" },
      { ru: "MX / TXT", en: "MX / TXT" },
      { ru: "NS / CNAME", en: "NS / CNAME" },
    ],
    howToSteps: [
      { ru: "Введите домен без https:// и пути.", en: "Enter a domain without https:// or path." },
      { ru: "Запустите проверку DNS-записей.", en: "Run the DNS record check." },
      { ru: "Проверьте значения, TTL, ошибки отдельных запросов и дальнейшие mail-рекомендации.", en: "Review values, TTLs, per-query errors, and follow-up mail recommendations." },
    ],
    supportedFeatures: [
      { ru: "Проверяет A, AAAA, CNAME, MX, NS и TXT записи.", en: "Checks A, AAAA, CNAME, MX, NS, and TXT records." },
      { ru: "Не принимает URL и IP literal как домен.", en: "Rejects URLs and IP literals as domain input." },
      { ru: "Отдельные DNS ошибки не ломают весь batch lookup.", en: "Per-record DNS errors do not fail the whole batch lookup." },
    ],
    limitations: [
      { ru: "Это не глобальная проверка распространения DNS по множеству резолверов.", en: "This is not global DNS propagation checking across multiple resolvers." },
      { ru: "DNSSEC, DKIM, DMARC и WHOIS идут отдельными инструментами.", en: "DNSSEC, DKIM, DMARC, and WHOIS belong to separate tools." },
    ],
    useCases: [
      { ru: "Быстро проверить базовую DNS-зону перед SEO/security аудитом.", en: "Quickly inspect the baseline DNS zone before SEO/security auditing." },
      { ru: "Понять, какие mail-related записи уже опубликованы.", en: "Understand which mail-related records are already published." },
      { ru: "Найти пустые или ошибочные ответы по ключевым типам записей.", en: "Find empty or failing responses for key record types." },
    ],
    technicalNotes: [
      { ru: "Инструмент выполняет DNS lookup по домену, а не HTTP fetch пользовательского URL.", en: "The tool performs DNS lookup for a domain, not HTTP fetch of a user URL." },
      { ru: "Результат зависит от выбранного resolver и текущего DNS cache/TTL состояния.", en: "The result depends on the selected resolver and current DNS cache/TTL state." },
    ],
    faq: [
      { question: { ru: "Можно вставить URL?", en: "Can I paste a URL?" }, answer: { ru: "Нет. Ввод должен быть доменом: example.com, без протокола и пути.", en: "No. Input must be a domain such as example.com, without protocol or path." } },
      { question: { ru: "Это проверка распространения DNS?", en: "Is this DNS propagation checking?" }, answer: { ru: "Нет. Это bounded lookup через resolver; глобальная propagation-проверка будет отдельным инструментом.", en: "No. This is a bounded resolver lookup; global propagation checking belongs to a separate tool." } },
    ],
    relatedToolSlugs: ["mx-record-checker", "spf-checker", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc1035"],
  }),
  toolPage({
    slug: "mx-record-checker",
    seoTitle: { ru: "Проверка MX-записей домена", en: "MX Record Checker" },
    metaDescription: { ru: "Проверьте MX-записи, приоритеты, null MX и наличие A/AAAA адресов у почтовых хостов.", en: "Check MX records, priorities, null MX, and A/AAAA address coverage for mail hosts." },
    h1: { ru: "Проверка MX-записей", en: "MX Record Checker" },
    lead: { ru: "Введите домен, чтобы проверить, принимает ли он почту технически: MX, приоритеты, null MX и адресацию mail hosts.", en: "Enter a domain to check whether it is technically prepared to receive email: MX, priorities, null MX, and mail host addressing." },
    quickFacts: [
      { ru: "MX hosts", en: "MX hosts" },
      { ru: "Null MX", en: "Null MX" },
      { ru: "A/AAAA coverage", en: "A/AAAA coverage" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола.", en: "Enter a domain without protocol." },
      { ru: "Запустите проверку MX.", en: "Run the MX check." },
      { ru: "Проверьте количество MX, приоритеты и наличие адресов у почтовых хостов.", en: "Review MX count, priorities, and mail host address coverage." },
    ],
    supportedFeatures: [
      { ru: "Проверяет MX-записи и сортируемые priority значения.", en: "Checks MX records and sortable priority values." },
      { ru: "Определяет null MX как явный сигнал отказа от входящей почты.", en: "Detects null MX as an explicit no-inbound-mail signal." },
      { ru: "Проверяет A/AAAA покрытие для каждого MX host.", en: "Checks A/AAAA coverage for each MX host." },
    ],
    limitations: [
      { ru: "Не подключается к SMTP и не проверяет TLS/STARTTLS баннеры.", en: "Does not connect to SMTP or validate TLS/STARTTLS banners." },
      { ru: "Не заменяет DKIM/DMARC/SPF проверку исходящей почты.", en: "Does not replace DKIM/DMARC/SPF checks for outbound mail." },
    ],
    useCases: [
      { ru: "Проверить домен перед настройкой корпоративной почты.", en: "Check a domain before corporate email setup." },
      { ru: "Найти MX hosts без адресных записей.", en: "Find MX hosts without address records." },
      { ru: "Отличить отсутствие MX от намеренного null MX.", en: "Distinguish missing MX from intentional null MX." },
    ],
    technicalNotes: [
      { ru: "Проверка ограничена DNS-уровнем и не выполняет SMTP transaction.", en: "The check is DNS-level only and does not perform SMTP transactions." },
      { ru: "Адреса MX hosts проверяются через A/AAAA lookup, без подключения к почтовому серверу.", en: "MX host addresses are checked through A/AAAA lookup without connecting to the mail server." },
    ],
    faq: [
      { question: { ru: "Один MX — это плохо?", en: "Is one MX bad?" }, answer: { ru: "Не обязательно. Для многих доменов один managed provider достаточно; важнее доступность host и SPF/DKIM/DMARC alignment.", en: "Not necessarily. One managed provider is enough for many domains; host reachability and SPF/DKIM/DMARC alignment matter more." } },
      { question: { ru: "MX checker проверяет SMTP?", en: "Does the MX checker test SMTP?" }, answer: { ru: "Нет. Он проверяет DNS MX и адресацию hosts; SMTP/TLS проверка будет отдельным сетевым инструментом.", en: "No. It checks DNS MX and host addressing; SMTP/TLS validation belongs to a separate network tool." } },
    ],
    relatedToolSlugs: ["dns-lookup", "spf-checker", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc7505"],
  }),
  toolPage({
    slug: "spf-checker",
    seoTitle: { ru: "Проверка SPF-записи домена", en: "SPF Record Checker" },
    metaDescription: { ru: "Проверьте SPF TXT, множественные SPF, final all policy, include/redirect и риск DNS lookup limit.", en: "Check SPF TXT, duplicate SPF records, final all policy, include/redirect, and DNS lookup-limit risk." },
    h1: { ru: "Проверка SPF-записи", en: "SPF Record Checker" },
    lead: { ru: "Введите домен, чтобы проверить SPF-политику исходящей почты без фейковых deliverability обещаний.", en: "Enter a domain to check outbound-mail SPF policy without fake deliverability promises." },
    quickFacts: [
      { ru: "v=spf1", en: "v=spf1" },
      { ru: "include / redirect", en: "include / redirect" },
      { ru: "-all / ~all", en: "-all / ~all" },
    ],
    howToSteps: [
      { ru: "Введите домен отправителя.", en: "Enter the sender domain." },
      { ru: "Запустите SPF-проверку TXT-записей.", en: "Run the SPF TXT check." },
      { ru: "Проверьте количество SPF, mechanisms, final all policy и lookup-risk.", en: "Review SPF count, mechanisms, final all policy, and lookup risk." },
    ],
    supportedFeatures: [
      { ru: "Находит v=spf1 TXT записи.", en: "Finds v=spf1 TXT records." },
      { ru: "Фиксирует ошибку множественных SPF records.", en: "Flags duplicate SPF records." },
      { ru: "Проверяет permissive all policy и estimated DNS-lookup mechanisms.", en: "Checks permissive all policy and estimated DNS-lookup mechanisms." },
    ],
    limitations: [
      { ru: "Не раскрывает рекурсивно все include цепочки в этом batch.", en: "Does not recursively expand all include chains in this batch." },
      { ru: "Не проверяет фактический inbox placement и репутацию домена.", en: "Does not check actual inbox placement or domain reputation." },
    ],
    useCases: [
      { ru: "Найти отсутствие SPF или два SPF records.", en: "Find missing SPF or two SPF records." },
      { ru: "Проверить, не открыт ли домен через +all/?all.", en: "Check whether the domain is open via +all/?all." },
      { ru: "Подготовиться к DMARC/DKIM hardening.", en: "Prepare for DMARC/DKIM hardening." },
    ],
    technicalNotes: [
      { ru: "Инструмент проверяет DNS TXT уровень и не обещает итоговую доставляемость писем.", en: "The tool checks DNS TXT policy and does not promise final email deliverability." },
      { ru: "Lookup-risk считается по видимым mechanisms без рекурсивного раскрытия include цепочек.", en: "Lookup risk is estimated from visible mechanisms without recursive include-chain expansion." },
    ],
    faq: [
      { question: { ru: "-all всегда лучше ~all?", en: "Is -all always better than ~all?" }, answer: { ru: "-all строже, но переходить на него нужно после проверки всех легитимных отправителей, иначе можно сломать исходящую почту.", en: "-all is stricter, but move to it only after verifying all legitimate senders or outbound mail can break." } },
      { question: { ru: "SPF гарантирует доставляемость?", en: "Does SPF guarantee deliverability?" }, answer: { ru: "Нет. SPF — только часть email authentication; нужны DKIM, DMARC, репутация и корректная инфраструктура отправки.", en: "No. SPF is only one part of email authentication; DKIM, DMARC, reputation, and sending infrastructure still matter." } },
    ],
    relatedToolSlugs: ["mx-record-checker", "dns-lookup", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc7208"],
  }),
] as const;
