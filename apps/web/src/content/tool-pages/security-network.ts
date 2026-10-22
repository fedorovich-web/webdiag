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
      { question: { ru: "Какой адрес указать для проверки DNS?", en: "What address should I enter for a DNS check?" }, answer: { ru: "Введите только доменное имя, например example.com. Уберите https://, путь к странице и параметры ссылки.", en: "Enter only the domain name, such as example.com. Leave out https://, page paths, and link parameters." } },
      { question: { ru: "Как понять, за что отвечают найденные записи?", en: "What do the returned records mean?" }, answer: { ru: "A и AAAA указывают адреса серверов, MX — серверы входящей почты, NS — серверы настроек домена. TXT содержит текстовые настройки, например правила отправки почты. Сверьте значения с инструкцией вашего хостинга или почтового сервиса.", en: "A and AAAA identify server addresses, MX identifies incoming mail servers, and NS identifies the domain's name servers. TXT holds text settings such as email sending rules. Compare the values with your hosting or email provider's instructions." } }
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
      { question: { ru: "Что покажет проверка почтовых серверов?", en: "What does the mail server check show?" }, answer: { ru: "Вы увидите, на какие серверы домен направляет входящую почту, их приоритет и найденные IP-адреса. Меньшее число приоритета означает, что почтовый сервер пробуют раньше остальных.", en: "It shows where the domain routes incoming mail, each server's priority, and its resolved IP addresses. A lower priority number means that server is tried before the others." } },
      { question: { ru: "Проверка прошла, но письма не приходят. Что делать?", en: "The check passed, but mail still does not arrive. What should I do?" }, answer: { ru: "Сверьте записи с настройками почтового сервиса и проверьте существование нужного ящика. Инструмент проверяет опубликованные адреса серверов, но не подключается к ящику и не отправляет пробное письмо.", en: "Compare the records with your email provider's settings and check that the mailbox exists. This tool checks published server addresses; it does not sign in to a mailbox or send a test message." } }
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
      { question: { ru: "Для чего домену нужна запись SPF?", en: "Why does a domain need an SPF record?" }, answer: { ru: "Она перечисляет серверы, которым разрешено отправлять почту от имени домена. Проверка показывает найденную запись и замечания к её настройкам. Состав разрешённых отправителей нужно сверять с вашими почтовыми сервисами.", en: "It lists the servers allowed to send email for the domain. The check shows the published record and configuration warnings. Compare the authorised senders with the email services you actually use." } },
      { question: { ru: "Почему письма попадают в спам при корректной SPF?", en: "Why can email go to spam when SPF is correct?" }, answer: { ru: "Почтовые сервисы учитывают и другие признаки: подпись письма, правила защиты домена, репутацию отправителя и содержание. Успешная проверка SPF не подтверждает доставку письма; дополнительно проверьте DKIM и DMARC.", en: "Email services also consider message signatures, domain protection rules, sender reputation, and content. A successful SPF check does not prove message delivery; check DKIM and DMARC as well." } }
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
      { question: { ru: "Что вводить в поле Selector?", en: "What belongs in the Selector field?" }, answer: { ru: "Это имя ключа подписи, которое выдаёт ваш почтовый сервис. Найдите его в настройках домена или инструкции по подключению почты. Укажите отдельно домен и это имя; адрес почтового ящика не нужен.", en: "This is the signing key name supplied by your email provider. Find it in the domain settings or email setup instructions. Enter the domain and that name separately; a mailbox address is not needed." } },
      { question: { ru: "Почему ключ DKIM не найден?", en: "Why was no DKIM key found?" }, answer: { ru: "Сначала проверьте имя ключа: у одного домена может быть несколько подписей с разными именами. Затем сравните опубликованную запись с инструкцией почтового сервиса. Отсутствие ключа по одному имени не означает, что вся почта домена отправляется без подписи.", en: "First check the key name: a domain can use several signing keys under different names. Then compare the published record with your email provider's instructions. A missing key at one name does not mean all mail from the domain is unsigned." } }
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
      { question: { ru: "Что означает политика DMARC none?", en: "What does a DMARC policy of none mean?" }, answer: { ru: "Домен публикует правила проверки отправителя, но не просит отклонять письма только на основании DMARC. Такой режим используют для наблюдения перед более строгой настройкой. Он сам по себе не означает поломку почты.", en: "The domain publishes sender verification rules but does not ask recipients to reject mail based on DMARC alone. This mode is used for observation before stricter settings. It does not by itself mean email is broken." } },
      { question: { ru: "Можно ли сразу включить отклонение подозрительных писем?", en: "Can I immediately enable rejection of suspicious mail?" }, answer: { ru: "Сначала убедитесь, что все ваши сервисы отправки правильно настроили SPF и DKIM, и изучите отчёты DMARC, если их получение включено. Иначе строгая политика может затронуть нужные письма. Инструмент показывает запись домена, а не проверяет каждое отправленное письмо.", en: "First confirm that all your sending services have correct SPF and DKIM settings, and review DMARC reports if reporting is enabled. Otherwise a strict policy can affect legitimate messages. This tool inspects the domain record, not every sent email." } }
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
      { question: { ru: "Что показывает проверка DNSSEC?", en: "What does the DNSSEC check show?" }, answer: { ru: "Она ищет опубликованные записи DS и DNSKEY, которые используются для защиты ответов о домене от подмены. В отчёте видно наличие этих записей. Проверка не подтверждает всю цепочку доверия от корневой зоны до вашего домена.", en: "It looks for published DS and DNSKEY records used to protect domain answers against tampering. The report shows whether those records are present. It does not verify the full trust chain from the root zone to your domain." } },
      { question: { ru: "Что делать, если найдена только одна из двух записей?", en: "What if only one of the two record types is found?" }, answer: { ru: "Сверьте настройки DNSSEC у регистратора и сервиса, который обслуживает DNS домена. Если вы недавно меняли эти настройки, повторите проверку позже: сохранённые ответы могут обновляться не одновременно. По одному такому результату причину определить нельзя.", en: "Compare DNSSEC settings at your registrar and DNS hosting service. If you recently changed them, check again later: cached answers may update at different times. This result alone cannot establish the cause." } }
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
      { question: { ru: "Как проверить срок действия сертификата сайта?", en: "How do I check a site's certificate expiry?" }, answer: { ru: "Укажите домен без https:// и пути к странице. Для обычного сайта оставьте порт 443. Результат покажет сведения о сертификате, срок действия и соответствие доменному имени, если сервер позволит получить эти данные.", en: "Enter the domain without https:// or a page path. Leave port 443 for an ordinary website. If the server provides the data, the result shows certificate details, validity dates, and whether it matches the domain." } },
      { question: { ru: "Что делать, если сертификат истёк или не подходит домену?", en: "What should I do if the certificate expired or does not match the domain?" }, answer: { ru: "Передайте результат администратору сайта или хостингу: сертификат нужно продлить либо установить для правильного имени. После изменения запустите проверку заново. WebDiag не выпускает и не устанавливает сертификаты.", en: "Send the result to your site administrator or hosting provider: the certificate needs renewal or installation for the correct name. Run the check again after the change. WebDiag does not issue or install certificates." } }
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
      { question: { ru: "Чем эта проверка отличается от проверки сертификата?", en: "How is this different from checking the certificate?" }, answer: { ru: "Здесь показаны параметры защищённого соединения, которые сервер согласовал с WebDiag: версия TLS, способ шифрования и протокол передачи данных. Сертификат описывает имя сайта и срок действия; параметры соединения помогают проверить настройку сервера.", en: "This check shows the secure connection settings negotiated between the server and WebDiag: the TLS version, cipher, and application protocol. The certificate describes the site name and validity; connection settings help assess server configuration." } },
      { question: { ru: "Почему результат отличается от данных моего браузера?", en: "Why can the result differ from my browser?" }, answer: { ru: "Браузер и WebDiag могут предлагать серверу разные параметры соединения. Отчёт относится к одному соединению с WebDiag и не перечисляет все способы шифрования, которые сервер способен поддерживать.", en: "Your browser and WebDiag can offer different connection settings. The report describes one connection with WebDiag; it does not list every cipher the server could support." } }
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
      { question: { ru: "Как понять, передаётся ли страница в сжатом виде?", en: "How can I tell whether a page is compressed?" }, answer: { ru: "Введите адрес страницы. В отчёте указано, сообщил ли сервер о сжатии ответа и какой способ использовал, например gzip или Brotli. Проверяется конкретный ответ сервера, а не все файлы сайта.", en: "Enter the page address. The report shows whether the server declared response compression and which method it used, such as gzip or Brotli. It checks that response, not every file on the site." } },
      { question: { ru: "Отсутствие сжатия всегда нужно исправлять?", en: "Does missing compression always need fixing?" }, answer: { ru: "Сжатие особенно полезно для текста, HTML, CSS и JavaScript. Изображения JPEG, PNG, WebP и AVIF уже используют свои способы сжатия. Учитывайте тип проверенного файла и рекомендации отчёта, прежде чем менять сервер.", en: "Compression is especially useful for text, HTML, CSS, and JavaScript. JPEG, PNG, WebP, and AVIF images already use their own compression methods. Consider the checked file type and report recommendations before changing the server." } }
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
      { question: { ru: "Что можно узнать из заголовков ответа сервера?", en: "What can response headers tell me?" }, answer: { ru: "Это служебные настройки ответа: тип содержимого, сжатие, кеширование и другие сведения, которые передаёт сервер. Введите адрес нужной страницы и используйте полученный список при настройке сайта или обсуждении проблемы с разработчиком.", en: "These are response settings such as content type, compression, caching, and other information supplied by the server. Enter the relevant page address and use the returned list when configuring the site or discussing a problem with a developer." } },
      { question: { ru: "Почему у разных страниц одного сайта разные результаты?", en: "Why do pages on the same site produce different results?" }, answer: { ru: "Сервер может по-разному обрабатывать HTML, изображения, файлы стилей и ответы с ошибками. Проверяйте именно тот адрес, где заметили проблему. Отчёт по главной странице не описывает настройки каждого ответа сайта.", en: "A server can handle HTML, images, stylesheets, and error responses differently. Check the exact address where you noticed the problem. A homepage report does not describe every response on the site." } }
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
      { question: { ru: "Покажет ли инструмент поддержку HTTP/2?", en: "Will the tool show HTTP/2 support?" }, answer: { ru: "В отчёте показан протокол, который сервер согласовал при проверочном защищённом соединении. Если согласован HTTP/2, это подтверждает его использование в этом соединении. Другой браузер или путь подключения может получить иной результат.", en: "The report shows the protocol negotiated during the secure test connection. If HTTP/2 was negotiated, it confirms its use for that connection. Another browser or connection path may get a different result." } },
      { question: { ru: "Что означает сообщение о поддержке HTTP/3?", en: "What does an HTTP/3 support message mean?" }, answer: { ru: "WebDiag ищет объявление HTTP/3 в служебном заголовке ответа. Это означает, что сервер предлагает такую возможность, но сам инструмент не устанавливает соединение HTTP/3. Для подтверждения фактической работы нужна отдельная проверка этим протоколом.", en: "WebDiag looks for an HTTP/3 advertisement in a response header. It means the server offers that option, but this tool does not establish an HTTP/3 connection. Confirming actual use requires a separate test with that protocol." } }
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
      { question: { ru: "Какие адреса вводить в поля URL и Origin?", en: "What should I enter in URL and Origin?" }, answer: { ru: "В URL укажите адрес сервера, к которому обращается приложение. В Origin — адрес самого приложения с протоколом и доменом, например https://example.com, без пути к странице. Так проверка сможет сопоставить ответ сервера с источником запроса.", en: "For URL, enter the server address requested by your application. For Origin, enter the application's scheme and domain, such as https://example.com, without a page path. The check can then compare the server response with the request source." } },
      { question: { ru: "Почему браузер блокирует запрос, хотя сервер отвечает?", en: "Why does the browser block a request even though the server responds?" }, answer: { ru: "Для обращения с другого сайта браузер требует разрешающие заголовки CORS. Проверьте, совпадает ли разрешённый адрес с Origin приложения. WebDiag проверяет заголовки обычного запроса; предварительный запрос OPTIONS и запросы с вашей авторизацией здесь не выполняются.", en: "For a request from another site, the browser requires suitable CORS response headers. Check whether the allowed address matches your application's Origin. WebDiag inspects an ordinary request; it does not run an OPTIONS preflight or requests using your sign-in credentials." } }
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
      { question: { ru: "Какие измерения показывает Server-Timing?", en: "What measurements does Server-Timing show?" }, answer: { ru: "Это длительности операций, которые сам сервер включил в ответ, например время работы с базой данных. Состав измерений определяет владелец сайта. Они помогают разбирать задержки на сервере, но не описывают всю загрузку страницы в браузере.", en: "These are operation durations that the server itself includes in the response, such as database time. The site owner chooses which measurements to publish. They can help investigate server delays but do not describe the full page load in a browser." } },
      { question: { ru: "Почему измерения отсутствуют?", en: "Why are there no measurements?" }, answer: { ru: "Сервер мог не настроить передачу Server-Timing либо промежуточный сервис не передал этот заголовок. Отсутствие данных не означает, что сайт работает быстро или медленно. Чтобы измерить загрузку страницы, воспользуйтесь проверкой скорости.", en: "The server may not publish Server-Timing, or an intermediary may have omitted the header. Missing data does not mean the site is fast or slow. Use the page speed check to measure loading performance." } }
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
      { question: { ru: "Что проверяет инструмент в cookie сайта?", en: "What does the tool check in a site's cookies?" }, answer: { ru: "Он разбирает cookie, которые сервер устанавливает в ответе на указанный адрес. Среди параметров — передача по защищённому соединению и доступность для JavaScript. Отчёт помогает найти технические замечания, но не оценивает законность работы сайта.", en: "It inspects cookies set by the server response to the specified address, including secure transport and JavaScript access settings. The report helps identify technical concerns; it does not assess legal compliance." } },
      { question: { ru: "Почему cookie не найдены, хотя я вижу их в браузере?", en: "Why are no cookies found when my browser has some?" }, answer: { ru: "Часть cookie появляется после входа, выбора настроек согласия или выполнения JavaScript. WebDiag получает отдельный ответ без вашей сессии и не повторяет эти действия. Проверка не показывает полный список cookie каждого посетителя.", en: "Some cookies appear after sign-in, consent choices, or JavaScript execution. WebDiag retrieves a separate response without your session and does not repeat those actions. The check does not show every visitor's complete cookie list." } }
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
      { question: { ru: "Почему на HTTPS-странице важны адреса ресурсов с http://?", en: "Why do http:// resource addresses matter on an HTTPS page?" }, answer: { ru: "Браузер может блокировать или менять загрузку незащищённых изображений, скриптов и других ресурсов на защищённой странице. Инструмент помогает найти такие адреса в полученном HTML. Проверьте доступность ресурса по HTTPS перед заменой ссылки.", en: "A browser may block or alter insecure image, script, and other resource loads on a secure page. This tool helps find such addresses in the retrieved HTML. Check that a resource is available over HTTPS before replacing its address." } },
      { question: { ru: "Проверка ничего не нашла, но браузер показывает предупреждение. Почему?", en: "Why does my browser warn about mixed content when the check found none?" }, answer: { ru: "Ресурс может подключаться из отдельного файла CSS или добавляться JavaScript. Эта проверка разбирает полученный HTML и не воспроизводит загрузку страницы в браузере. Для таких случаев изучите предупреждение и адрес ресурса в инструментах разработчика браузера.", en: "A resource may be loaded from a separate CSS file or added by JavaScript. This check inspects retrieved HTML and does not reproduce a browser page load. In that case, inspect the warning and resource address in your browser's developer tools." } }
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
      { question: { ru: "Что показывает проверка политики CSP?", en: "What does the CSP policy check show?" }, answer: { ru: "CSP — это правила, которыми сайт ограничивает загрузку скриптов, изображений и других ресурсов. Инструмент читает опубликованную политику и отмечает выбранные потенциально опасные разрешения. Результат помогает обсуждать настройки с разработчиком.", en: "CSP is a set of rules a site uses to restrict scripts, images, and other resources. The tool reads the published policy and flags selected potentially risky permissions. The result helps you discuss settings with a developer." } },
      { question: { ru: "Как применять рекомендации, чтобы не сломать сайт?", en: "How can I apply the recommendations without breaking the site?" }, answer: { ru: "Сначала проверьте, какие внешние ресурсы действительно нужны странице, и протестируйте изменения на копии сайта. Слишком строгие правила могут остановить формы, аналитику или другие функции. Успешная проверка выбранных правил не гарантирует защиту от всех атак.", en: "First identify which external resources the page needs and test changes on a copy of the site. Overly strict rules can stop forms, analytics, or other features. Passing the selected checks does not guarantee protection against every attack." } }
    ],
    relatedToolSlugs: ["security-headers-checker", "http-headers-analyzer", "third-party-script-analyzer"],
    sourceUrls: ["https://www.w3.org/TR/CSP3/", "https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP"],
  }),

  toolPage({
    slug: "dns-propagation-checker",
    seoTitle: { ru: "Сравнение DNS-резолверов", en: "DNS Resolver Comparison" },
    metaDescription: { ru: "Сравните один тип DNS-записи через Cloudflare, Google Public DNS, Quad9 и OpenDNS без fake global propagation claims.", en: "Compare one DNS record type across Cloudflare, Google Public DNS, Quad9, and OpenDNS without fake global propagation claims." },
    h1: { ru: "Сравнение DNS-резолверов", en: "DNS Resolver Comparison" },
    lead: { ru: "Введите домен и тип записи, чтобы сравнить bounded backend snapshots четырёх recursive resolvers: ответы, ошибки и количество distinct answer sets.", en: "Enter a domain and record type to compare bounded backend snapshots from four recursive resolvers: answers, errors, and distinct answer sets." },
    quickFacts: [
      { ru: "4 резолвера", en: "4 resolvers" },
      { ru: "1 record type", en: "1 record type" },
      { ru: "backend snapshot", en: "backend snapshot" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола и пути.", en: "Enter a domain without protocol or path." },
      { ru: "Выберите A, AAAA, CNAME, MX, NS или TXT.", en: "Choose A, AAAA, CNAME, MX, NS, or TXT." },
      { ru: "Сравните answer sets, частичные ошибки и TTL.", en: "Compare answer sets, partial errors, and TTLs." },
    ],
    supportedFeatures: [
      { ru: "Параллельно опрашивает четыре фиксированных публичных recursive resolver.", en: "Queries four fixed public recursive resolvers in parallel." },
      { ru: "Сравнивает значения и MX priority без учёта различий TTL.", en: "Compares values and MX priority while ignoring TTL differences." },
      { ru: "Показывает backend-to-resolver latency как диагностический сигнал.", en: "Shows backend-to-resolver latency as a diagnostic signal." },
    ],
    limitations: [
      { ru: "Это не глобальный мониторинг всех DNS caches и не доказательство propagation.", en: "This is not global monitoring of every DNS cache and does not prove propagation." },
      { ru: "Latency измеряется от backend WebDiag, а не от устройства пользователя.", en: "Latency is measured from the WebDiag backend, not the user's device." },
    ],
    useCases: [
      { ru: "Сравнить cache state после DNS-изменения.", en: "Compare cache state after a DNS change." },
      { ru: "Найти resolver-specific mismatch или частичный timeout.", en: "Find resolver-specific mismatches or partial timeouts." },
      { ru: "Проверить один record type без полного zone audit.", en: "Check one record type without a full zone audit." },
    ],
    technicalNotes: [
      { ru: "Resolver snapshots зависят от TTL, recursive cache и момента запроса.", en: "Resolver snapshots depend on TTL, recursive cache, and request time." },
      { ru: "Для окончательной проверки нужно сверять authoritative nameservers.", en: "Authoritative nameservers should be checked for final verification." },
    ],
    faq: [
      { question: { ru: "Как проверить изменения DNS после переноса сайта?", en: "How can I check DNS changes after moving a site?" }, answer: { ru: "Укажите домен и тип изменённой записи. WebDiag сравнит ответы выбранных DNS-сервисов в одном отчёте. Различия помогут увидеть, что эти сервисы пока возвращают разные значения; это не проверка всех сетей мира.", en: "Enter the domain and the record type you changed. WebDiag compares answers from selected DNS services in one report. Differences show that those services currently return different values; this is not a check of every network worldwide." } },
      { question: { ru: "Нужно ли снова менять запись, если ответы различаются?", en: "Should I change the record again when answers differ?" }, answer: { ru: "Сначала сверьте настройку у вашего DNS-провайдера. Сервисы могут некоторое время хранить прежний ответ, а некоторые домены намеренно возвращают разные адреса для разных регионов. Повторите проверку позже и сравните результат; одно различие ещё не указывает на ошибку.", en: "First verify the setting at your DNS provider. Services can retain older answers for a time, and some domains intentionally return different regional addresses. Check again later and compare results; a difference alone does not establish an error." } }
    ],
    relatedToolSlugs: ["dns-lookup", "dnssec-checker", "whois-lookup"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc1035"],
  }),

  toolPage({
    slug: "whois-lookup",
    seoTitle: { ru: "RDAP-проверка домена", en: "Domain RDAP Lookup" },
    metaDescription: { ru: "Получите registry RDAP данные домена через IANA bootstrap: статусы, события, nameservers, registrar и abuse contact без WHOIS scraping.", en: "Retrieve registry RDAP data through IANA bootstrap: statuses, events, nameservers, registrar, and abuse contact without WHOIS scraping." },
    h1: { ru: "RDAP-проверка домена", en: "Domain RDAP Lookup" },
    lead: { ru: "Введите домен, чтобы найти его RDAP service через IANA bootstrap и получить bounded registration record без claims о владении или доступности.", en: "Enter a domain to find its RDAP service through IANA bootstrap and retrieve a bounded registration record without ownership or availability claims." },
    quickFacts: [
      { ru: "IANA bootstrap", en: "IANA bootstrap" },
      { ru: "registry RDAP", en: "registry RDAP" },
      { ru: "без registrant PII", en: "no registrant PII" },
    ],
    howToSteps: [
      { ru: "Введите домен без URL-схемы.", en: "Enter a domain without a URL scheme." },
      { ru: "Запустите RDAP lookup.", en: "Run the RDAP lookup." },
      { ru: "Проверьте statuses, events, nameservers, registrar и DNSSEC delegation signal.", en: "Review statuses, events, nameservers, registrar, and the DNSSEC delegation signal." },
    ],
    supportedFeatures: [
      { ru: "Определяет authoritative RDAP service через IANA DNS bootstrap.", en: "Finds the authoritative RDAP service through the IANA DNS bootstrap." },
      { ru: "Показывает bounded events, nameservers, registrar и abuse contact.", en: "Shows bounded events, nameservers, registrar, and abuse contact." },
      { ru: "Не выводит registrant personal contact data.", en: "Does not display registrant personal contact data." },
    ],
    limitations: [
      { ru: "RDAP 404 не доказывает, что домен свободен для регистрации.", en: "RDAP 404 does not prove a domain is available for registration." },
      { ru: "Registry data не подтверждает фактическое владение, безопасность или репутацию домена.", en: "Registry data does not confirm actual ownership, safety, or domain reputation." },
    ],
    useCases: [
      { ru: "Проверить registration/expiration events и статусы домена.", en: "Review domain registration/expiration events and statuses." },
      { ru: "Найти registrar и опубликованный abuse contact.", en: "Find the registrar and published abuse contact." },
      { ru: "Сверить nameservers и delegationSigned signal.", en: "Review nameservers and the delegationSigned signal." },
    ],
    technicalNotes: [
      { ru: "Инструмент использует RDAP JSON и не парсит нестандартизированный legacy WHOIS text.", en: "The tool uses RDAP JSON and does not parse non-standard legacy WHOIS text." },
      { ru: "Bootstrap и RDAP responses проходят bounded safe HTTP fetch.", en: "Bootstrap and RDAP responses use bounded safe HTTP fetching." },
    ],
    faq: [
      { question: { ru: "Какие сведения о регистрации домена можно получить?", en: "What domain registration details can I obtain?" }, answer: { ru: "Введите домен, чтобы увидеть данные, опубликованные его реестром: регистратора, статусы, даты и серверы DNS, если они доступны. Часть сведений может быть скрыта или не предоставлена реестром. Данные о владельце доступны не для каждого домена.", en: "Enter a domain to see details published by its registry, such as the registrar, statuses, dates, and name servers when available. Some details may be withheld or not supplied. Owner information is not available for every domain." } },
      { question: { ru: "Если данные не найдены, домен свободен для покупки?", en: "Does a missing result mean the domain is available to buy?" }, answer: { ru: "Такой вывод делать нельзя: причиной может быть отсутствие ответа или ограничение реестра. Проверьте доступность домена непосредственно у регистратора перед покупкой. WebDiag не регистрирует домены и не подтверждает возможность покупки.", en: "No: the registry may have failed to respond or restricted access. Check availability directly with a registrar before buying. WebDiag does not register domains or confirm that a purchase is possible." } }
    ],
    relatedToolSlugs: ["dns-lookup", "dns-propagation-checker", "dnssec-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9224", "https://www.rfc-editor.org/rfc/rfc9082", "https://data.iana.org/rdap/"],
  }),

  toolPage({
    slug: "ip-information",
    seoTitle: { ru: "RDAP-информация об IP-сети", en: "IP RDAP Network Lookup" },
    metaDescription: { ru: "Проверьте registry allocation data публичного IPv4/IPv6 через IANA RDAP bootstrap: диапазон, CIDR, handle, statuses и abuse contact.", en: "Check registry allocation data for a public IPv4/IPv6 address through IANA RDAP bootstrap: range, CIDR, handle, statuses, and abuse contact." },
    h1: { ru: "RDAP-информация об IP-сети", en: "IP RDAP Network Lookup" },
    lead: { ru: "Введите публичный IP, чтобы получить bounded network registration record без геолокации, reputation score и claims о текущем пользователе адреса.", en: "Enter a public IP to retrieve a bounded network registration record without geolocation, reputation scores, or claims about the current address user." },
    quickFacts: [
      { ru: "IPv4 / IPv6", en: "IPv4 / IPv6" },
      { ru: "range + CIDR", en: "range + CIDR" },
      { ru: "не геолокация", en: "not geolocation" },
    ],
    howToSteps: [
      { ru: "Введите публичный глобальный IP-адрес.", en: "Enter a public global IP address." },
      { ru: "Запустите IP RDAP lookup.", en: "Run the IP RDAP lookup." },
      { ru: "Проверьте allocation range, CIDR, network handle, statuses и abuse contact.", en: "Review the allocation range, CIDR, network handle, statuses, and abuse contact." },
    ],
    supportedFeatures: [
      { ru: "Использует IANA IPv4/IPv6 RDAP bootstrap и наиболее специфичный prefix match.", en: "Uses IANA IPv4/IPv6 RDAP bootstrap and the most-specific prefix match." },
      { ru: "Показывает registry range, CIDR0, handle, type и country field.", en: "Shows registry range, CIDR0, handle, type, and country field." },
      { ru: "Отклоняет private, loopback и другие non-global IP.", en: "Rejects private, loopback, and other non-global IP addresses." },
    ],
    limitations: [
      { ru: "Поле country относится к allocation record и не является точной геолокацией устройства.", en: "The country field belongs to the allocation record and is not precise device geolocation." },
      { ru: "Инструмент не проверяет reputation, ASN routing, reverse DNS или владельца конкретного соединения.", en: "The tool does not check reputation, ASN routing, reverse DNS, or the owner of a specific connection." },
    ],
    useCases: [
      { ru: "Определить registry network range для incident triage.", en: "Identify the registry network range during incident triage." },
      { ru: "Найти опубликованный abuse contact для сети.", en: "Find the network's published abuse contact." },
      { ru: "Сверить CIDR и allocation handle без коммерческого IP API.", en: "Review CIDR and allocation handle without a commercial IP API." },
    ],
    technicalNotes: [
      { ru: "Результат описывает RIR/registry allocation и может не отражать текущую маршрутизацию или аренду адреса.", en: "The result describes RIR/registry allocation and may not reflect current routing or address leasing." },
      { ru: "IP и RDAP bootstrap URLs проходят bounded safe HTTP fetch.", en: "IP and RDAP bootstrap URLs use bounded safe HTTP fetching." },
    ],
    faq: [
      { question: { ru: "Какой адрес нужен для получения сведений об IP?", en: "What address should I enter for an IP lookup?" }, answer: { ru: "Введите публичный IPv4- или IPv6-адрес без https:// и пути. Инструмент покажет регистрационные сведения о сети, которой выделен этот адрес, если реестр их предоставляет. Доменное имя нужно проверять отдельным инструментом DNS.", en: "Enter a public IPv4 or IPv6 address without https:// or a path. The tool shows registration details for the network allocated that address when the registry supplies them. Use the DNS tool for a domain name." } },
      { question: { ru: "Можно ли по отчёту определить местонахождение человека?", en: "Can this report locate a person?" }, answer: { ru: "Нет. Данные относятся к регистрации сети и её владельцу, а не к конкретному устройству или человеку. Даже указанная страна не подтверждает местонахождение посетителя. Для оценки угроз или проверки чёрных списков этот отчёт тоже не предназначен.", en: "No. The details describe a network registration and its operator, not a particular device or person. Even a country field does not establish a visitor's location. The report is also not a threat assessment or blacklist check." } }
    ],
    relatedToolSlugs: ["dns-lookup", "whois-lookup", "ssl-certificate-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9224", "https://www.rfc-editor.org/rfc/rfc9082", "https://data.iana.org/rdap/"],
  }),
  toolPage({
    slug: "pem-certificate-viewer",
    seoTitle: { ru: "Просмотр PEM X.509-сертификатов онлайн", en: "PEM X.509 Certificate Viewer Online" },
    metaDescription: { ru: "Локально разберите PEM-цепочку X.509: subject, issuer, сроки, SAN, алгоритмы и SHA-256 fingerprint без загрузки сертификатов.", en: "Inspect a PEM X.509 chain locally: subject, issuer, validity, SANs, algorithms, and SHA-256 fingerprints without uploading certificates." },
    h1: { ru: "Просмотр PEM X.509-сертификатов", en: "PEM X.509 Certificate Viewer" },
    lead: { ru: "Вставьте один или несколько публичных сертификатов, чтобы проверить структуру и порядок цепочки локально в браузере без сетевой валидации.", en: "Paste one or more public certificates to inspect their structure and chain order locally in your browser without network validation." },
    quickFacts: [{ ru: "До 20 сертификатов", en: "Up to 20 certificates" }, { ru: "SHA-256 fingerprint", en: "SHA-256 fingerprint" }, { ru: "Без загрузки", en: "No upload" }],
    howToSteps: [{ ru: "Вставьте PEM-блоки CERTIFICATE.", en: "Paste PEM CERTIFICATE blocks." }, { ru: "Запустите локальный разбор.", en: "Run the local inspection." }, { ru: "Проверьте subject, issuer, validity, SAN и порядок цепочки.", en: "Review subject, issuer, validity, SANs, and chain order." }],
    supportedFeatures: [{ ru: "Разбирает bounded DER/ASN.1 X.509 certificate structure.", en: "Parses bounded DER/ASN.1 X.509 certificate structures." }, { ru: "Показывает serial, ключевой и signature algorithms, Basic Constraints и SAN.", en: "Shows serial, key and signature algorithms, Basic Constraints, and SANs." }, { ru: "Рассчитывает SHA-256 fingerprint через Web Crypto.", en: "Calculates SHA-256 fingerprints through Web Crypto." }],
    limitations: [{ ru: "Не выполняет hostname verification, OCSP, CRL, trust-store или сетевую проверку цепочки.", en: "Does not perform hostname verification, OCSP, CRL, trust-store, or network chain validation." }, { ru: "CSR и закрытые ключи намеренно отклоняются.", en: "CSRs and private keys are intentionally rejected." }],
    useCases: [{ ru: "Проверить публичный сертификат перед установкой.", en: "Inspect a public certificate before installation." }, { ru: "Сверить SAN и сроки действия.", en: "Review SANs and validity dates." }, { ru: "Сопоставить SHA-256 fingerprint вне сети.", en: "Compare a SHA-256 fingerprint offline." }],
    technicalNotes: [{ ru: "Вход ограничен 1 000 000 символов, 20 сертификатами и 256 000 DER bytes на сертификат.", en: "Input is bounded to 1,000,000 characters, 20 certificates, and 256,000 DER bytes per certificate." }, { ru: "Результат является inspection, а не доказательством доверия сертификату.", en: "The result is an inspection, not proof that a certificate is trusted." }],
    faq: [
      { question: { ru: "Какие данные можно вставить для просмотра сертификата?", en: "What can I paste to inspect a certificate?" }, answer: { ru: "Вставьте открытый сертификат в текстовом формате PEM с блоком BEGIN CERTIFICATE. Закрытые ключи здесь не нужны: инструмент отклоняет их. Используйте только публичную часть сертификата.", en: "Paste a public certificate in text PEM format with a BEGIN CERTIFICATE block. Private keys are not needed and are rejected by this tool. Use only the public certificate." } },
      { question: { ru: "Можно ли по этому отчёту понять, доверяет ли браузер сертификату?", en: "Can this report establish whether a browser trusts the certificate?" }, answer: { ru: "Отчёт показывает сведения из вставленного сертификата без подключения к сайту. Он не проверяет доверие браузера или установку сертификата на сервере. Для проверки действующего сайта используйте инструмент проверки SSL-сертификата.", en: "The report shows details from the pasted certificate without connecting to a site. It does not check browser trust or server installation. Use the SSL certificate checker to inspect a live site." } }
    ],
    relatedToolSlugs: ["ssl-certificate-checker", "tls-configuration-checker", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc5280", "https://www.rfc-editor.org/rfc/rfc7468"],
  }),

] as const;
