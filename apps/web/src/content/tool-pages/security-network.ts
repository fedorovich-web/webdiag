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

  toolPage({
    slug: "dkim-checker",
    seoTitle: { ru: "Проверка DKIM-записи", en: "DKIM Record Checker" },
    metaDescription: { ru: "Проверьте DKIM TXT запись по домену и selector без проверки реальных писем.", en: "Check a DKIM TXT record by domain and selector without validating real emails." },
    h1: { ru: "Проверка DKIM-записи", en: "DKIM Record Checker" },
    lead: { ru: "Введите домен и DKIM selector, чтобы проверить наличие DKIM TXT, key type и публичного ключа.", en: "Enter a domain and DKIM selector to check DKIM TXT presence, key type, and public-key publication." },
    quickFacts: [
      { ru: "selector._domainkey", en: "selector._domainkey" },
      { ru: "k= / p=", en: "k= / p=" },
      { ru: "DNS-only", en: "DNS-only" },
    ],
    howToSteps: [
      { ru: "Введите домен отправителя без протокола.", en: "Enter the sender domain without protocol." },
      { ru: "Введите DKIM selector из настроек почтового провайдера.", en: "Enter the DKIM selector from your mail provider settings." },
      { ru: "Проверьте количество DKIM records, тип ключа и наличие p= public key.", en: "Review DKIM record count, key type, and p= public key presence." },
    ],
    supportedFeatures: [
      { ru: "Проверяет TXT record по selector._domainkey.domain.", en: "Checks TXT record at selector._domainkey.domain." },
      { ru: "Извлекает DKIM tags и фиксирует пустой p=.", en: "Extracts DKIM tags and flags an empty p= value." },
      { ru: "Не делает fake-проверку подписи реальных писем.", en: "Does not fake validation of real email signatures." },
    ],
    limitations: [
      { ru: "Нужен правильный selector; домен сам по себе DKIM не раскрывает.", en: "A correct selector is required; a domain alone does not reveal DKIM." },
      { ru: "Не проверяет фактическое подписание исходящих сообщений.", en: "Does not check actual signing of outbound messages." },
    ],
    useCases: [
      { ru: "Проверить публикацию DKIM после настройки почтового сервиса.", en: "Verify DKIM publication after mail-service setup." },
      { ru: "Найти пустой или неполный DKIM key.", en: "Find an empty or incomplete DKIM key." },
      { ru: "Подготовить домен к DMARC alignment.", en: "Prepare a domain for DMARC alignment." },
    ],
    technicalNotes: [
      { ru: "Проверка ограничена DNS TXT уровнем и не анализирует SMTP headers.", en: "The check is limited to DNS TXT and does not analyze SMTP headers." },
      { ru: "Статус показывает качество публикации записи, не итоговую доставляемость.", en: "Status reflects record-publication quality, not final deliverability." },
    ],
    faq: [
      { question: { ru: "Где взять selector?", en: "Where do I find the selector?" }, answer: { ru: "В настройках почтового провайдера: Google Workspace, Яндекс 360, Mailgun, SendGrid и т.д.", en: "In your mail provider settings: Google Workspace, Mailgun, SendGrid, and similar services." } },
      { question: { ru: "DKIM checker гарантирует доставку писем?", en: "Does DKIM guarantee delivery?" }, answer: { ru: "Нет. DKIM — только часть authentication stack вместе с SPF, DMARC и репутацией отправителя.", en: "No. DKIM is only one part of authentication alongside SPF, DMARC, and sender reputation." } },
    ],
    relatedToolSlugs: ["spf-checker", "dmarc-checker", "dns-lookup"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc6376"],
  }),
  toolPage({
    slug: "dmarc-checker",
    seoTitle: { ru: "Проверка DMARC-записи", en: "DMARC Record Checker" },
    metaDescription: { ru: "Проверьте DMARC TXT, p=/sp= policy, pct, rua/ruf и alignment-теги.", en: "Check DMARC TXT, p=/sp= policy, pct, rua/ruf, and alignment tags." },
    h1: { ru: "Проверка DMARC-записи", en: "DMARC Record Checker" },
    lead: { ru: "Введите домен, чтобы проверить _dmarc TXT без fake deliverability обещаний.", en: "Enter a domain to check _dmarc TXT without fake deliverability promises." },
    quickFacts: [
      { ru: "p=none/quarantine/reject", en: "p=none/quarantine/reject" },
      { ru: "rua/ruf", en: "rua/ruf" },
      { ru: "alignment", en: "alignment" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола.", en: "Enter a domain without protocol." },
      { ru: "Запустите проверку _dmarc TXT.", en: "Run the _dmarc TXT check." },
      { ru: "Проверьте policy, pct, reporting и alignment tags.", en: "Review policy, pct, reporting, and alignment tags." },
    ],
    supportedFeatures: [
      { ru: "Находит одну или несколько v=DMARC1 записей.", en: "Finds one or multiple v=DMARC1 records." },
      { ru: "Проверяет p=, sp=, pct=, rua/ruf, adkim и aspf.", en: "Checks p=, sp=, pct=, rua/ruf, adkim, and aspf." },
      { ru: "Отделяет monitoring-only p=none от enforcement policy.", en: "Separates monitoring-only p=none from enforcement policy." },
    ],
    limitations: [
      { ru: "Не проверяет фактические отчёты rua/ruf и mailbox availability.", en: "Does not validate actual rua/ruf reports or mailbox availability." },
      { ru: "Не обещает попадание писем во входящие.", en: "Does not promise inbox placement." },
    ],
    useCases: [
      { ru: "Найти отсутствие DMARC или две DMARC записи.", en: "Find missing DMARC or duplicate DMARC records." },
      { ru: "Проверить готовность к quarantine/reject.", en: "Check readiness for quarantine/reject." },
      { ru: "Контролировать mail authentication hardening.", en: "Control mail authentication hardening." },
    ],
    technicalNotes: [
      { ru: "Проверяется TXT запись _dmarc.domain на DNS уровне.", en: "The _dmarc.domain TXT record is checked at DNS level." },
      { ru: "DMARC enforcement требует корректного SPF/DKIM alignment.", en: "DMARC enforcement requires correct SPF/DKIM alignment." },
    ],
    faq: [
      { question: { ru: "p=none — это ошибка?", en: "Is p=none an error?" }, answer: { ru: "Нет, это monitoring mode. Но для защиты домена нужно двигаться к quarantine или reject после проверки SPF/DKIM.", en: "No, it is monitoring mode. For protection, move toward quarantine or reject after SPF/DKIM validation." } },
      { question: { ru: "Нужен ли rua?", en: "Do I need rua?" }, answer: { ru: "Да, aggregate reports помогают контролировать alignment и безопасно ужесточать policy.", en: "Yes, aggregate reports help monitor alignment and safely tighten policy." } },
    ],
    relatedToolSlugs: ["spf-checker", "dkim-checker", "mx-record-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc7489"],
  }),
  toolPage({
    slug: "dnssec-checker",
    seoTitle: { ru: "Проверка DNSSEC домена", en: "DNSSEC Domain Checker" },
    metaDescription: { ru: "Проверьте публикацию DS и DNSKEY записей домена без заявления полной validation-chain проверки.", en: "Check DS and DNSKEY publication without claiming full validation-chain validation." },
    h1: { ru: "Проверка DNSSEC домена", en: "DNSSEC Domain Checker" },
    lead: { ru: "Введите домен, чтобы проверить видимость DS и DNSKEY как DNSSEC publication check.", en: "Enter a domain to check DS and DNSKEY visibility as a DNSSEC publication check." },
    quickFacts: [
      { ru: "DS", en: "DS" },
      { ru: "DNSKEY", en: "DNSKEY" },
      { ru: "publication check", en: "publication check" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола.", en: "Enter a domain without protocol." },
      { ru: "Запустите проверку DS/DNSKEY.", en: "Run the DS/DNSKEY check." },
      { ru: "Проверьте наличие делегирования и ключей зоны.", en: "Review delegation and zone-key visibility." },
    ],
    supportedFeatures: [
      { ru: "Проверяет DS records домена.", en: "Checks domain DS records." },
      { ru: "Проверяет DNSKEY records домена.", en: "Checks domain DNSKEY records." },
      { ru: "Показывает algorithms из DNSKEY publication signal.", en: "Shows algorithms from DNSKEY publication signals." },
    ],
    limitations: [
      { ru: "Это не полная криптографическая проверка цепочки доверия.", en: "This is not a full cryptographic chain-of-trust validation." },
      { ru: "Результат зависит от resolver и текущего DNS cache/TTL состояния.", en: "The result depends on resolver behavior and current DNS cache/TTL state." },
    ],
    useCases: [
      { ru: "Понять, опубликованы ли DNSSEC записи.", en: "Understand whether DNSSEC records are published." },
      { ru: "Найти DNSKEY без DS или DS без DNSKEY.", en: "Find DNSKEY without DS or DS without DNSKEY." },
      { ru: "Проверить базовую DNSSEC-гигиену домена.", en: "Check baseline DNSSEC hygiene for a domain." },
    ],
    technicalNotes: [
      { ru: "Инструмент запрашивает DS и DNSKEY через DNS resolver.", en: "The tool queries DS and DNSKEY through a DNS resolver." },
      { ru: "Для полной валидации позже нужен отдельный validating resolver layer.", en: "Full validation later requires a separate validating resolver layer." },
    ],
    faq: [
      { question: { ru: "Это гарантирует, что DNSSEC работает?", en: "Does this guarantee DNSSEC works?" }, answer: { ru: "Нет. Это publication check. Полная проверка должна валидировать цепочку доверия.", en: "No. This is a publication check. Full validation must verify the chain of trust." } },
      { question: { ru: "Почему DS есть, а DNSKEY нет?", en: "Why is DS present but DNSKEY missing?" }, answer: { ru: "Возможны проблемы зоны, resolver или временное состояние DNS cache. Нужно проверить у регистратора и authoritative DNS.", en: "Possible zone, resolver, or cache-state issues. Check registrar and authoritative DNS." } },
    ],
    relatedToolSlugs: ["dns-lookup", "spf-checker", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc4033"],
  }),

  toolPage({
    slug: "ssl-certificate-checker",
    seoTitle: { ru: "Проверка SSL-сертификата сайта", en: "SSL Certificate Checker" },
    metaDescription: { ru: "Проверьте срок действия SSL-сертификата, issuer, SAN и соответствие hostname без fake security score.", en: "Check SSL certificate validity, issuer, SAN coverage, and hostname match without a fake security score." },
    h1: { ru: "Проверка SSL-сертификата", en: "SSL Certificate Checker" },
    lead: { ru: "Введите hostname, чтобы проверить сертификат через одиночный TLS handshake и получить понятные сигналы продления.", en: "Enter a hostname to inspect the certificate through a single TLS handshake and get clear renewal signals." },
    quickFacts: [
      { ru: "expiry", en: "expiry" },
      { ru: "SAN", en: "SAN" },
      { ru: "hostname match", en: "hostname match" },
    ],
    howToSteps: [
      { ru: "Введите hostname без https:// и пути.", en: "Enter a hostname without https:// or path." },
      { ru: "Запустите SSL-проверку.", en: "Run the SSL check." },
      { ru: "Проверьте срок, issuer, SAN и hostname match.", en: "Review expiry, issuer, SAN, and hostname match." },
    ],
    supportedFeatures: [
      { ru: "Проверяет срок действия сертификата и days until expiry.", en: "Checks certificate validity and days until expiry." },
      { ru: "Показывает issuer, subject CN и SAN coverage.", en: "Shows issuer, subject CN, and SAN coverage." },
      { ru: "Отклоняет URL, IP literals и локальные/private targets.", en: "Rejects URLs, IP literals, and local/private targets." },
    ],
    limitations: [
      { ru: "Это одиночный TLS handshake, не полный SSL Labs аудит.", en: "This is a single TLS handshake, not a full SSL Labs audit." },
      { ru: "OCSP, CT logs и full chain linting идут в будущих расширениях.", en: "OCSP, CT logs, and full chain linting belong to future extensions." },
    ],
    useCases: [
      { ru: "Проверить, не истекает ли сертификат сайта.", en: "Check whether a site certificate is close to expiry." },
      { ru: "Найти hostname mismatch после CDN или reverse proxy настройки.", en: "Find hostname mismatch after CDN or reverse-proxy setup." },
      { ru: "Подготовить домен к мониторингу SSL expiry.", en: "Prepare a domain for SSL-expiry monitoring." },
    ],
    technicalNotes: [
      { ru: "Инструмент подключается к публичному hostname с SNI и не принимает IP literal.", en: "The tool connects to a public hostname with SNI and does not accept IP literals." },
      { ru: "Результат не является юридической оценкой безопасности сайта.", en: "The result is not a legal security assessment of the site." },
    ],
    faq: [
      { question: { ru: "Это заменяет SSL Labs?", en: "Does this replace SSL Labs?" }, answer: { ru: "Нет. Это быстрая встроенная проверка сертификата; глубокий TLS audit будет отдельным уровнем.", en: "No. This is a fast embedded certificate check; deep TLS audit is a separate layer." } },
      { question: { ru: "Можно проверять localhost?", en: "Can I check localhost?" }, answer: { ru: "Нет. Публичный инструмент принимает только публичные hostname.", en: "No. The public tool accepts only public hostnames." } },
    ],
    relatedToolSlugs: ["tls-configuration-checker", "http-compression-checker", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc8446"],
  }),
  toolPage({
    slug: "tls-configuration-checker",
    seoTitle: { ru: "Проверка TLS-конфигурации", en: "TLS Configuration Checker" },
    metaDescription: { ru: "Проверьте TLS version, cipher suite, ALPN/HTTP2 signal и certificate health через bounded handshake.", en: "Check TLS version, cipher suite, ALPN/HTTP2 signal, and certificate health through a bounded handshake." },
    h1: { ru: "Проверка TLS-конфигурации", en: "TLS Configuration Checker" },
    lead: { ru: "Введите hostname, чтобы проверить modern TLS handshake без ложных заявлений полного protocol audit.", en: "Enter a hostname to check a modern TLS handshake without claiming a full protocol audit." },
    quickFacts: [
      { ru: "TLS 1.2 / 1.3", en: "TLS 1.2 / 1.3" },
      { ru: "cipher", en: "cipher" },
      { ru: "ALPN", en: "ALPN" },
    ],
    howToSteps: [
      { ru: "Введите hostname и порт.", en: "Enter hostname and port." },
      { ru: "Запустите TLS-проверку.", en: "Run the TLS check." },
      { ru: "Проверьте negotiated protocol, cipher и certificate signals.", en: "Review negotiated protocol, cipher, and certificate signals." },
    ],
    supportedFeatures: [
      { ru: "Показывает negotiated TLS version и cipher suite.", en: "Shows negotiated TLS version and cipher suite." },
      { ru: "Показывает ALPN negotiated protocol, включая h2 signal.", en: "Shows ALPN negotiated protocol, including h2 signal." },
      { ru: "Связывает TLS-сигналы с базовым certificate health.", en: "Connects TLS signals with baseline certificate health." },
    ],
    limitations: [
      { ru: "Не перебирает все cipher suites и legacy protocols.", en: "Does not enumerate all cipher suites and legacy protocols." },
      { ru: "Не является полным vulnerability scanner.", en: "Is not a full vulnerability scanner." },
    ],
    useCases: [
      { ru: "Понять, какой TLS реально negotiated для сайта.", en: "Understand which TLS version is actually negotiated for a site." },
      { ru: "Найти отсутствие HTTP/2 ALPN signal.", en: "Find missing HTTP/2 ALPN signal." },
      { ru: "Подготовить TLS health к production readiness аудиту.", en: "Prepare TLS health for production-readiness auditing." },
    ],
    technicalNotes: [
      { ru: "Результат основан на одном handshake с современным клиентским context.", en: "The result is based on one handshake with a modern client context." },
      { ru: "Для полного TLS matrix позже нужен отдельный scanner worker.", en: "A full TLS matrix later requires a separate scanner worker." },
    ],
    faq: [
      { question: { ru: "Почему нет списка всех cipher?", en: "Why no full cipher list?" }, answer: { ru: "Это bounded tool. Полный перебор cipher suites будет отдельным security scanner, чтобы не делать тяжёлые проверки синхронно.", en: "This is a bounded tool. Full cipher enumeration belongs to a separate security scanner to avoid heavy synchronous checks." } },
      { question: { ru: "HTTP/2 проверяется?", en: "Is HTTP/2 checked?" }, answer: { ru: "Инструмент показывает ALPN negotiated protocol, если сервер его отдаёт.", en: "The tool shows the ALPN negotiated protocol when the server returns it." } },
    ],
    relatedToolSlugs: ["ssl-certificate-checker", "http-compression-checker", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc8446"],
  }),
  toolPage({
    slug: "http-compression-checker",
    seoTitle: { ru: "Проверка HTTP-сжатия Brotli/Gzip", en: "HTTP Brotli/Gzip Compression Checker" },
    metaDescription: { ru: "Проверьте Content-Encoding, Vary: Accept-Encoding и compressible content type для HTML/CSS/JS/JSON ответов.", en: "Check Content-Encoding, Vary: Accept-Encoding, and compressible content type for HTML/CSS/JS/JSON responses." },
    h1: { ru: "Проверка HTTP-сжатия", en: "HTTP Compression Checker" },
    lead: { ru: "Введите URL, чтобы проверить, включено ли gzip/Brotli/deflate сжатие и корректный Vary для cache safety.", en: "Enter a URL to check gzip/Brotli/deflate compression and cache-safe Vary behavior." },
    quickFacts: [
      { ru: "gzip / br", en: "gzip / br" },
      { ru: "Vary", en: "Vary" },
      { ru: "text assets", en: "text assets" },
    ],
    howToSteps: [
      { ru: "Введите публичный http/https URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите проверку compression policy.", en: "Run the compression policy check." },
      { ru: "Проверьте Content-Encoding, content type и Vary header.", en: "Review Content-Encoding, content type, and Vary header." },
    ],
    supportedFeatures: [
      { ru: "Проверяет Content-Encoding и compressible candidate response.", en: "Checks Content-Encoding and compressible candidate response." },
      { ru: "Проверяет Vary: Accept-Encoding для shared cache correctness.", en: "Checks Vary: Accept-Encoding for shared-cache correctness." },
      { ru: "Работает через SafeHttpFetcher с SSRF защитой.", en: "Runs through SafeHttpFetcher with SSRF protection." },
    ],
    limitations: [
      { ru: "Это single-response check, не полный waterfall аудит всех assets.", en: "This is a single-response check, not a full waterfall audit of all assets." },
      { ru: "PageSpeed и browser waterfall используются отдельными performance tools.", en: "PageSpeed and browser waterfall belong to separate performance tools." },
    ],
    useCases: [
      { ru: "Найти не сжатый HTML/CSS/JS ответ.", en: "Find an uncompressed HTML/CSS/JS response." },
      { ru: "Проверить Vary перед CDN/cache настройкой.", en: "Check Vary before CDN/cache configuration." },
      { ru: "Подготовить сайт к speed/Core Web Vitals оптимизации.", en: "Prepare a site for speed/Core Web Vitals optimization." },
    ],
    technicalNotes: [
      { ru: "Инструмент не скачивает большой body и не строит network waterfall.", en: "The tool does not download a large body and does not build a network waterfall." },
      { ru: "Для полной оценки веса страницы используйте Page Weight Analyzer и PageSpeed Checker.", en: "Use Page Weight Analyzer and PageSpeed Checker for full page-weight evaluation." },
    ],
    faq: [
      { question: { ru: "Всегда нужен Brotli?", en: "Do I always need Brotli?" }, answer: { ru: "Для HTTPS text assets Brotli обычно предпочтителен, но gzip fallback остаётся нормальной практикой.", en: "Brotli is usually preferable for HTTPS text assets, but gzip fallback remains normal practice." } },
      { question: { ru: "Почему изображения не считаются compressible?", en: "Why are images not compressible?" }, answer: { ru: "JPEG/WebP/AVIF/PNG уже сжаты своими форматами; их оптимизируют через image tools, а не HTTP gzip.", en: "JPEG/WebP/AVIF/PNG are already format-compressed; optimize them through image tools, not HTTP gzip." } },
    ],
    relatedToolSlugs: ["page-weight-analyzer", "core-web-vitals-checker", "cache-policy-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9110"],
  }),
] as const;
