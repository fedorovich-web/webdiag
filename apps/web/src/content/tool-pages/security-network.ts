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
  toolPage({
    slug: "http-headers-analyzer",
    seoTitle: { ru: "Анализ HTTP-заголовков", en: "HTTP Headers Analyzer" },
    metaDescription: { ru: "Проверьте response headers страницы: status, redirects, Server/X-Powered-By, cache и content metadata.", en: "Check page response headers: status, redirects, Server/X-Powered-By, cache, and content metadata." },
    h1: { ru: "Анализ HTTP-заголовков", en: "HTTP Headers Analyzer" },
    lead: { ru: "Введите URL, чтобы получить полный header inventory без дублирования отдельного Security Headers Checker.", en: "Enter a URL to get a full header inventory without duplicating the dedicated Security Headers Checker." },
    quickFacts: [
      { ru: "response headers", en: "response headers" },
      { ru: "cache/content", en: "cache/content" },
      { ru: "single response", en: "single response" },
    ],
    howToSteps: [
      { ru: "Введите публичный http/https URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите анализ HTTP headers.", en: "Run the HTTP header analysis." },
      { ru: "Проверьте disclosure, cache/content metadata и raw headers.", en: "Review disclosure, cache/content metadata, and raw headers." },
    ],
    supportedFeatures: [
      { ru: "Показывает status, redirects и количество headers.", en: "Shows status, redirects, and header count." },
      { ru: "Фиксирует Server и X-Powered-By disclosure.", en: "Flags Server and X-Powered-By disclosure." },
      { ru: "Показывает cache-control, content-type, encoding и Vary.", en: "Shows cache-control, content-type, encoding, and Vary." },
    ],
    limitations: [
      { ru: "Это single-response check, не crawler и не waterfall.", en: "This is a single-response check, not a crawler or waterfall." },
      { ru: "Security headers оцениваются отдельным специализированным инструментом.", en: "Security headers are evaluated by a separate dedicated tool." },
    ],
    useCases: [
      { ru: "Быстро увидеть полный набор response headers.", en: "Quickly inspect the full response header set." },
      { ru: "Найти лишнее раскрытие технологии в headers.", en: "Find unnecessary technology disclosure in headers." },
      { ru: "Подготовить данные для CDN/cache настройки.", en: "Prepare data for CDN/cache configuration." },
    ],
    technicalNotes: [
      { ru: "Инструмент использует SafeHttpFetcher и не скачивает большой body.", en: "The tool uses SafeHttpFetcher and does not download a large body." },
      { ru: "Результат отражает один ответ на момент проверки.", en: "The result reflects one response at check time." },
    ],
    faq: [
      { question: { ru: "Это заменяет Security Headers Checker?", en: "Does this replace Security Headers Checker?" }, answer: { ru: "Нет. Здесь общий inventory headers; security policy проверяется отдельным tool.", en: "No. This is a general header inventory; security policy is checked by a separate tool." } },
      { question: { ru: "Почему Server header — warning?", en: "Why is Server header a warning?" }, answer: { ru: "Он может раскрывать детали стека. Не всегда критично, но требует осознанной настройки.", en: "It can reveal stack details. Not always critical, but should be intentional." } },
    ],
    relatedToolSlugs: ["security-headers-checker", "cache-policy-checker", "http-compression-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9110"],
  }),
  toolPage({
    slug: "http-protocol-checker",
    seoTitle: { ru: "Проверка HTTP/2 и HTTP/3", en: "HTTP/2 and HTTP/3 Checker" },
    metaDescription: { ru: "Проверьте HTTP/2 через ALPN и HTTP/3 advertisement через Alt-Svc без fake QUIC negotiation.", en: "Check HTTP/2 through ALPN and HTTP/3 advertisement through Alt-Svc without fake QUIC negotiation." },
    h1: { ru: "Проверка HTTP/2 и HTTP/3", en: "HTTP/2 and HTTP/3 Checker" },
    lead: { ru: "Введите URL, чтобы проверить negotiated HTTP/2 signal и HTTP/3 Alt-Svc advertisement.", en: "Enter a URL to check negotiated HTTP/2 signal and HTTP/3 Alt-Svc advertisement." },
    quickFacts: [
      { ru: "ALPN", en: "ALPN" },
      { ru: "Alt-Svc", en: "Alt-Svc" },
      { ru: "bounded", en: "bounded" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTPS URL.", en: "Enter a public HTTPS URL." },
      { ru: "Запустите protocol check.", en: "Run the protocol check." },
      { ru: "Проверьте ALPN h2 и Alt-Svc h3 signals.", en: "Review ALPN h2 and Alt-Svc h3 signals." },
    ],
    supportedFeatures: [
      { ru: "Проверяет HTTP/2 по TLS ALPN negotiation.", en: "Checks HTTP/2 through TLS ALPN negotiation." },
      { ru: "Проверяет HTTP/3 advertisement через Alt-Svc header.", en: "Checks HTTP/3 advertisement through the Alt-Svc header." },
      { ru: "Показывает TLS version context.", en: "Shows TLS version context." },
    ],
    limitations: [
      { ru: "Не делает QUIC handshake и не заявляет full HTTP/3 validation.", en: "Does not perform a QUIC handshake or claim full HTTP/3 validation." },
      { ru: "Не перебирает все CDN/protocol варианты.", en: "Does not enumerate all CDN/protocol variants." },
    ],
    useCases: [
      { ru: "Понять, отдаёт ли сайт HTTP/2 современному клиенту.", en: "Understand whether the site serves HTTP/2 to a modern client." },
      { ru: "Проверить, рекламируется ли HTTP/3 через CDN.", en: "Check whether HTTP/3 is advertised through a CDN." },
      { ru: "Подготовить protocol layer к performance audit.", en: "Prepare protocol layer for a performance audit." },
    ],
    technicalNotes: [
      { ru: "HTTP/2 определяется по ALPN результата TLS handshake.", en: "HTTP/2 is detected from the TLS handshake ALPN result." },
      { ru: "HTTP/3 определяется только как advertised signal в Alt-Svc.", en: "HTTP/3 is detected only as an advertised signal in Alt-Svc." },
    ],
    faq: [
      { question: { ru: "Почему HTTP/3 только advertised?", en: "Why is HTTP/3 only advertised?" }, answer: { ru: "Полная проверка HTTP/3 требует QUIC-capable transport. Здесь фиксируется проверяемый Alt-Svc signal.", en: "Full HTTP/3 validation requires QUIC-capable transport. This tool records the verifiable Alt-Svc signal." } },
      { question: { ru: "HTTP URL подходит?", en: "Can I test HTTP URLs?" }, answer: { ru: "Можно, но ALPN работает через TLS, поэтому для protocol check нужен HTTPS.", en: "You can, but ALPN works through TLS, so protocol checks need HTTPS." } },
    ],
    relatedToolSlugs: ["tls-configuration-checker", "http-compression-checker", "core-web-vitals-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9110"],
  }),
  toolPage({
    slug: "cors-checker",
    seoTitle: { ru: "Проверка CORS-заголовков", en: "CORS Header Checker" },
    metaDescription: { ru: "Проверьте Access-Control-Allow-Origin, credentials, Vary: Origin и wildcard risks для заданного Origin.", en: "Check Access-Control-Allow-Origin, credentials, Vary: Origin, and wildcard risks for a given Origin." },
    h1: { ru: "Проверка CORS-заголовков", en: "CORS Header Checker" },
    lead: { ru: "Введите URL API и Origin, чтобы проверить CORS response headers без fake browser simulation.", en: "Enter an API URL and Origin to check CORS response headers without fake browser simulation." },
    quickFacts: [
      { ru: "ACAO", en: "ACAO" },
      { ru: "credentials", en: "credentials" },
      { ru: "Vary: Origin", en: "Vary: Origin" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL ресурса.", en: "Enter a public resource URL." },
      { ru: "Введите Origin, который нужно проверить.", en: "Enter the Origin to test." },
      { ru: "Проверьте ACAO, credentials и cache variation.", en: "Review ACAO, credentials, and cache variation." },
    ],
    supportedFeatures: [
      { ru: "Отправляет безопасный request с Origin header.", en: "Sends a safe request with an Origin header." },
      { ru: "Проверяет wildcard + credentials misconfiguration.", en: "Checks wildcard + credentials misconfiguration." },
      { ru: "Фиксирует Vary: Origin для cache correctness.", en: "Flags Vary: Origin for cache correctness." },
    ],
    limitations: [
      { ru: "Не выполняет browser preflight matrix для всех методов.", en: "Does not execute a browser preflight matrix for all methods." },
      { ru: "Не тестирует private/internal endpoints.", en: "Does not test private/internal endpoints." },
    ],
    useCases: [
      { ru: "Проверить, разрешён ли конкретный frontend Origin.", en: "Check whether a specific frontend Origin is allowed." },
      { ru: "Найти опасный wildcard с credentials.", en: "Find dangerous wildcard with credentials." },
      { ru: "Подготовить API к безопасному CDN/cache поведению.", en: "Prepare an API for safe CDN/cache behavior." },
    ],
    technicalNotes: [
      { ru: "Проверка не является полной browser CORS emulation.", en: "The check is not full browser CORS emulation." },
      { ru: "Результат основан на одном safe HTTP request с заданным Origin.", en: "The result is based on one safe HTTP request with the given Origin." },
    ],
    faq: [
      { question: { ru: "Почему * + credentials плохо?", en: "Why is * + credentials bad?" }, answer: { ru: "Такую комбинацию нельзя считать контролируемой политикой доступа и её нельзя использовать для credentialed access.", en: "That combination is not a controlled access policy and must not be used for credentialed access." } },
      { question: { ru: "Это проверяет OPTIONS preflight?", en: "Does this check OPTIONS preflight?" }, answer: { ru: "Нет. Preflight matrix будет отдельным расширением, чтобы не смешивать простой header check и heavy API testing.", en: "No. A preflight matrix is a later extension to avoid mixing simple header checks with heavier API testing." } },
    ],
    relatedToolSlugs: ["http-headers-analyzer", "security-headers-checker", "http-protocol-checker"],
    sourceUrls: ["https://fetch.spec.whatwg.org/"],
  }),

  toolPage({
    slug: "server-timing-analyzer",
    seoTitle: { ru: "Анализ Server-Timing", en: "Server-Timing Analyzer" },
    metaDescription: { ru: "Проверьте Server-Timing header, dur и desc metrics одного HTTP-ответа без fake performance claims.", en: "Check Server-Timing header metrics, dur, and desc values for one HTTP response without fake performance claims." },
    h1: { ru: "Анализ Server-Timing", en: "Server-Timing Analyzer" },
    lead: { ru: "Введите URL, чтобы разобрать Server-Timing header и увидеть backend timing signals, которые сервер отдаёт клиенту.", en: "Enter a URL to parse the Server-Timing header and inspect backend timing signals exposed to clients." },
    quickFacts: [
      { ru: "Server-Timing", en: "Server-Timing" },
      { ru: "dur / desc", en: "dur / desc" },
      { ru: "single response", en: "single response" },
    ],
    howToSteps: [
      { ru: "Введите публичный http/https URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите анализ response headers.", en: "Run response-header analysis." },
      { ru: "Проверьте metrics, duration и description values.", en: "Review metric names, duration, and description values." },
    ],
    supportedFeatures: [
      { ru: "Разбирает Server-Timing header на metrics.", en: "Parses Server-Timing header metrics." },
      { ru: "Показывает dur= и desc= параметры.", en: "Shows dur= and desc= parameters." },
      { ru: "Не подменяет Lighthouse или RUM-аналитику.", en: "Does not replace Lighthouse or RUM analytics." },
    ],
    limitations: [
      { ru: "Не измеряет реальное время выполнения backend операций.", en: "Does not measure actual backend operation duration." },
      { ru: "Проверяет только один HTTP response.", en: "Checks only one HTTP response." },
    ],
    useCases: [
      { ru: "Проверить, публикует ли backend timing metrics.", en: "Check whether backend timing metrics are published." },
      { ru: "Найти отсутствующий Server-Timing перед performance work.", en: "Find missing Server-Timing before performance work." },
      { ru: "Проверить формат metrics после релиза.", en: "Validate metric formatting after a release." },
    ],
    technicalNotes: [
      { ru: "Инструмент читает header, а не строит synthetic benchmark.", en: "The tool reads a header, not a synthetic benchmark." },
      { ru: "Результат зависит от конкретного URL и cache/CDN слоя.", en: "The result depends on the URL and cache/CDN layer." },
    ],
    faq: [
      { question: { ru: "Это замена PageSpeed?", en: "Is this a PageSpeed replacement?" }, answer: { ru: "Нет. Server-Timing показывает опубликованные сервером metrics; PageSpeed и RUM измеряют другие уровни performance.", en: "No. Server-Timing exposes server-published metrics; PageSpeed and RUM measure different performance layers." } },
      { question: { ru: "Почему header отсутствует?", en: "Why is the header missing?" }, answer: { ru: "Многие сайты не публикуют Server-Timing или скрывают его на CDN/cache уровне.", en: "Many sites do not publish Server-Timing or hide it at the CDN/cache layer." } },
    ],
    relatedToolSlugs: ["http-headers-analyzer", "core-web-vitals-checker", "cache-policy-checker"],
    sourceUrls: ["https://www.w3.org/TR/server-timing/"],
  }),
  toolPage({
    slug: "cookie-policy-checker",
    seoTitle: { ru: "Проверка политики cookie", en: "Cookie Policy Checker" },
    metaDescription: { ru: "Проверьте Set-Cookie атрибуты: Secure, HttpOnly, SameSite, persistent cookies и базовые issues одного ответа.", en: "Check Set-Cookie attributes: Secure, HttpOnly, SameSite, persistent cookies, and baseline issues for one response." },
    h1: { ru: "Проверка политики cookie", en: "Cookie Policy Checker" },
    lead: { ru: "Введите URL, чтобы проверить Set-Cookie headers без browser session tracking и без анализа consent banner.", en: "Enter a URL to inspect Set-Cookie headers without browser session tracking or consent-banner analysis." },
    quickFacts: [
      { ru: "Secure", en: "Secure" },
      { ru: "HttpOnly", en: "HttpOnly" },
      { ru: "SameSite", en: "SameSite" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL.", en: "Enter a public URL." },
      { ru: "Запустите cookie policy check.", en: "Run the cookie policy check." },
      { ru: "Проверьте Set-Cookie count, атрибуты и issues.", en: "Review Set-Cookie count, attributes, and issues." },
    ],
    supportedFeatures: [
      { ru: "Проверяет Secure, HttpOnly и SameSite.", en: "Checks Secure, HttpOnly, and SameSite." },
      { ru: "Фиксирует SameSite=None без Secure.", en: "Flags SameSite=None without Secure." },
      { ru: "Отмечает persistent cookies по Max-Age/Expires.", en: "Marks persistent cookies by Max-Age/Expires." },
    ],
    limitations: [
      { ru: "Не кликает cookie banner и не анализирует legal consent.", en: "Does not click cookie banners or analyze legal consent." },
      { ru: "Проверяет только Set-Cookie headers одного ответа.", en: "Checks only Set-Cookie headers from one response." },
    ],
    useCases: [
      { ru: "Найти cookies без Secure или HttpOnly.", en: "Find cookies missing Secure or HttpOnly." },
      { ru: "Проверить SameSite policy после релиза.", en: "Check SameSite policy after release." },
      { ru: "Подготовить baseline для security review.", en: "Prepare a baseline for security review." },
    ],
    technicalNotes: [
      { ru: "Инструмент не оценивает законодательное соответствие cookie banner.", en: "The tool does not assess legal compliance of cookie banners." },
      { ru: "Некоторые cookies могут появляться только после JS или login-flow.", en: "Some cookies may appear only after JavaScript or login flows." },
    ],
    faq: [
      { question: { ru: "Это legal cookie audit?", en: "Is this a legal cookie audit?" }, answer: { ru: "Нет. Это техническая проверка Set-Cookie атрибутов, не юридическая оценка согласия.", en: "No. This is a technical Set-Cookie attribute check, not legal consent assessment." } },
      { question: { ru: "Почему нет cookies?", en: "Why are there no cookies?" }, answer: { ru: "Ответ мог не отдавать Set-Cookie до login, JS-flow или выбора consent.", en: "The response may not set cookies before login, JavaScript flow, or consent choice." } },
    ],
    relatedToolSlugs: ["security-headers-checker", "cors-checker", "http-headers-analyzer"],
    sourceUrls: ["https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie"],
  }),
  toolPage({
    slug: "mixed-content-checker",
    seoTitle: { ru: "Проверка смешанного контента", en: "Mixed Content Checker" },
    metaDescription: { ru: "Найдите HTTP subresource candidates внутри HTTPS HTML: scripts, iframes, stylesheets, images, media и srcset.", en: "Find HTTP subresource candidates inside HTTPS HTML: scripts, iframes, stylesheets, images, media, and srcset." },
    h1: { ru: "Проверка смешанного контента", en: "Mixed Content Checker" },
    lead: { ru: "Введите HTTPS URL, чтобы найти static HTML mixed-content candidates без browser runtime DOM и CSS crawling.", en: "Enter an HTTPS URL to find static HTML mixed-content candidates without browser runtime DOM or CSS crawling." },
    quickFacts: [
      { ru: "active/passive", en: "active/passive" },
      { ru: "static HTML", en: "static HTML" },
      { ru: "HTTPS page", en: "HTTPS page" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTPS URL.", en: "Enter a public HTTPS URL." },
      { ru: "Запустите mixed-content scan.", en: "Run the mixed-content scan." },
      { ru: "Проверьте active и passive HTTP subresources.", en: "Review active and passive HTTP subresources." },
    ],
    supportedFeatures: [
      { ru: "Проверяет script, iframe, object, embed и stylesheet.", en: "Checks script, iframe, object, embed, and stylesheet." },
      { ru: "Проверяет img, audio, video, source, poster и srcset.", en: "Checks img, audio, video, source, poster, and srcset." },
      { ru: "Разделяет active и passive mixed content.", en: "Separates active and passive mixed content." },
    ],
    limitations: [
      { ru: "Не исполняет JavaScript и не строит browser DOM.", en: "Does not execute JavaScript or build a browser DOM." },
      { ru: "Не сканирует CSS background-image и runtime assets.", en: "Does not scan CSS background-image or runtime assets." },
    ],
    useCases: [
      { ru: "Найти HTTP resources перед HTTPS migration.", en: "Find HTTP resources before HTTPS migration." },
      { ru: "Проверить шаблон после смены CDN/assets host.", en: "Check a template after changing CDN/assets host." },
      { ru: "Убрать active mixed content из production pages.", en: "Remove active mixed content from production pages." },
    ],
    technicalNotes: [
      { ru: "Результат основан на bounded static HTML parsing.", en: "The result is based on bounded static HTML parsing." },
      { ru: "Browser-level mixed content blocking будет отдельным crawler/browser gate.", en: "Browser-level mixed-content blocking belongs to a later crawler/browser gate." },
    ],
    faq: [
      { question: { ru: "Почему CSS background-image не найден?", en: "Why is CSS background-image not detected?" }, answer: { ru: "Этот batch не скачивает CSS и не исполняет runtime DOM; это честное ограничение static HTML scan.", en: "This batch does not fetch CSS or execute runtime DOM; that is an explicit static HTML scan limit." } },
      { question: { ru: "HTTP-ссылки в меню считаются mixed content?", en: "Are HTTP menu links mixed content?" }, answer: { ru: "Обычные navigation links не считаются subresources; инструмент ищет загружаемые ресурсы страницы.", en: "Regular navigation links are not subresources; the tool finds page-loaded resources." } },
    ],
    relatedToolSlugs: ["ssl-certificate-checker", "http-protocol-checker", "security-headers-checker"],
    sourceUrls: ["https://developer.mozilla.org/en-US/docs/Web/Security/Mixed_content"],
  }),

  toolPage({
    slug: "csp-analyzer",
    seoTitle: { ru: "Анализ Content Security Policy", en: "Content Security Policy Analyzer" },
    metaDescription: { ru: "Разберите CSP header, Report-Only и static meta policy: директивы, unsafe-inline, unsafe-eval, wildcard sources и ключевые ограничения.", en: "Parse CSP headers, Report-Only, and static meta policies: directives, unsafe-inline, unsafe-eval, wildcard sources, and key restrictions." },
    h1: { ru: "Анализ Content Security Policy", en: "Content Security Policy Analyzer" },
    lead: { ru: "Введите URL, чтобы получить bounded policy review без исполнения страницы, fake security score и обещаний защиты от всех XSS-сценариев.", en: "Enter a URL for a bounded policy review without executing the page, producing a fake security score, or claiming protection from every XSS scenario." },
    quickFacts: [
      { ru: "header + meta", en: "header + meta" },
      { ru: "Report-Only", en: "Report-Only" },
      { ru: "директивы и sources", en: "directives and sources" },
    ],
    howToSteps: [
      { ru: "Введите публичный http/https URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите разбор CSP response headers и static meta.", en: "Run CSP response-header and static-meta parsing." },
      { ru: "Проверьте risky sources, missing directives и ограничения meta policy.", en: "Review risky sources, missing directives, and meta-policy limits." },
    ],
    supportedFeatures: [
      { ru: "Разбирает enforced CSP, Report-Only и meta CSP.", en: "Parses enforced CSP, Report-Only, and meta CSP." },
      { ru: "Показывает directives, values и duplicate directives.", en: "Shows directives, values, and duplicate directives." },
      { ru: "Отмечает unsafe-inline, unsafe-eval, wildcard и missing key directives.", en: "Flags unsafe-inline, unsafe-eval, wildcard, and missing key directives." },
    ],
    limitations: [
      { ru: "Не исполняет JavaScript и не наблюдает browser CSP violations.", en: "Does not execute JavaScript or observe browser CSP violations." },
      { ru: "Не доказывает отсутствие XSS, bypass или ошибок серверной логики.", en: "Does not prove the absence of XSS, bypasses, or server-side logic flaws." },
    ],
    useCases: [
      { ru: "Проверить CSP после изменения CDN, analytics или frontend bundle.", en: "Check CSP after changing CDN, analytics, or frontend bundles." },
      { ru: "Найти слишком широкие source expressions перед hardening.", en: "Find overly broad source expressions before hardening." },
      { ru: "Сравнить enforced и Report-Only rollout signals.", en: "Compare enforced and Report-Only rollout signals." },
    ],
    technicalNotes: [
      { ru: "Meta CSP имеет ограничения и не заменяет HTTP header для frame-ancestors.", en: "Meta CSP has limitations and does not replace the HTTP header for frame-ancestors." },
      { ru: "Перед ужесточением policy нужен report-only rollout и проверка реальных ресурсов.", en: "Policy tightening should use a report-only rollout and validation of actual resources." },
    ],
    faq: [
      { question: { ru: "Это дублирует Security Headers Checker?", en: "Does this duplicate Security Headers Checker?" }, answer: { ru: "Нет. Security Headers Checker проверяет общий набор headers, а этот инструмент разбирает структуру и source expressions CSP.", en: "No. Security Headers Checker covers the general header set; this tool parses CSP structure and source expressions." } },
      { question: { ru: "Статус pass гарантирует защиту от XSS?", en: "Does pass guarantee XSS protection?" }, answer: { ru: "Нет. Pass означает только отсутствие выбранных risky constructions в bounded static review.", en: "No. Pass only means the selected risky constructions were not found in the bounded static review." } },
    ],
    relatedToolSlugs: ["security-headers-checker", "http-headers-analyzer", "third-party-script-analyzer"],
    sourceUrls: ["https://www.w3.org/TR/CSP3/", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"],
  }),
] as const;
