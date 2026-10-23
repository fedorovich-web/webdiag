import { toolPage } from "./shared";

export const securityNetworkToolPages = [
  toolPage({
    slug: "dns-lookup",
    seoTitle: { ru: "Проверка DNS-записей домена", en: "DNS Lookup — DNS Records Checker" },
    metaDescription: { ru: "Проверьте DNS-записи домена A, AAAA, CNAME, MX, NS и TXT, их значения, TTL и ошибки отдельных запросов.", en: "Check A, AAAA, CNAME, MX, NS, and TXT records for a domain without URL crawling." },
    h1: { ru: "Проверка DNS-записей", en: "DNS Records Lookup" },
    lead: { ru: "Введите домен, чтобы получить его основные DNS-записи и замечания по их настройке.", en: "Enter a domain to retrieve its main DNS records and review configuration findings." },
    quickFacts: [
      { ru: "A / AAAA", en: "A / AAAA" },
      { ru: "MX / TXT", en: "MX / TXT" },
      { ru: "NS / CNAME", en: "NS / CNAME" },
    ],
    howToSteps: [
      { ru: "Введите домен без https:// и пути.", en: "Enter a domain without https:// or a path." },
      { ru: "Запустите проверку DNS-записей.", en: "Run the DNS record check." },
      { ru: "Проверьте значения, TTL, ошибки запросов и рекомендации по настройке почты.", en: "Review values, TTLs, per-query errors, and follow-up mail recommendations." },
    ],
    supportedFeatures: [
      { ru: "Запрашивает записи A, AAAA, CNAME, MX, NS и TXT.", en: "Checks A, AAAA, CNAME, MX, NS, and TXT records." },
      { ru: "Принимает доменное имя; URL и IP-адреса не подходят для этой проверки.", en: "Rejects URLs and IP literals as domain input." },
      { ru: "Показывает ошибки отдельных типов записей вместе с доступными ответами.", en: "Per-record DNS errors do not fail the whole batch lookup." },
    ],
    limitations: [
      { ru: "Результат не показывает распространение DNS-изменений по всем сетям.", en: "This is not global DNS propagation checking across multiple resolvers." },
      { ru: "Проверки DNSSEC, DKIM, DMARC и регистрации домена доступны отдельно.", en: "DNSSEC, DKIM, DMARC, and WHOIS belong to separate tools." },
    ],
    useCases: [
      { ru: "Проверить основные DNS-записи перед SEO-аудитом или проверкой безопасности.", en: "Quickly inspect the baseline DNS zone before SEO/security auditing." },
      { ru: "Узнать, какие записи для почты уже опубликованы.", en: "Understand which mail-related records are already published." },
      { ru: "Найти пустые ответы и ошибки запросов.", en: "Find empty or failing responses for key record types." },
    ],
    technicalNotes: [
      { ru: "Инструмент выполняет DNS-запросы и не загружает страницы сайта.", en: "The tool performs DNS lookup for a domain, not HTTP fetch of a user URL." },
      { ru: "Ответ зависит от DNS-сервиса, содержимого его кэша и TTL.", en: "The result depends on the selected resolver and current DNS cache/TTL state." },
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
    metaDescription: { ru: "Проверьте MX-записи домена, их приоритеты, null MX и наличие записей A/AAAA у каждого почтового сервера.", en: "Check MX records, priorities, null MX, and A/AAAA address coverage for mail hosts." },
    h1: { ru: "Проверка MX-записей", en: "MX Record Checker" },
    lead: { ru: "Введите домен, чтобы проверить DNS-настройки приёма почты: почтовые серверы, их приоритеты и адреса.", en: "Enter a domain to check whether it is technically prepared to receive email: MX, priorities, null MX, and mail host addressing." },
    quickFacts: [
      { ru: "Почтовые серверы", en: "MX hosts" },
      { ru: "Null MX", en: "Null MX" },
      { ru: "Записи A/AAAA", en: "A/AAAA coverage" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола.", en: "Enter a domain without a URL scheme." },
      { ru: "Запустите проверку MX.", en: "Run the MX check." },
      { ru: "Проверьте список серверов, приоритеты и наличие адресов A/AAAA.", en: "Review MX count, priorities, and mail host address coverage." },
    ],
    supportedFeatures: [
      { ru: "Показывает MX-записи и их приоритеты.", en: "Checks MX records and sortable priority values." },
      { ru: "Распознаёт null MX — явное указание, что домен не принимает почту.", en: "Detects null MX as an explicit no-inbound-mail signal." },
      { ru: "Запрашивает записи A/AAAA каждого почтового сервера.", en: "Checks A/AAAA coverage for each MX host." },
    ],
    limitations: [
      { ru: "Не подключается к SMTP-серверам и не проверяет TLS/STARTTLS.", en: "Does not connect to SMTP or validate TLS/STARTTLS banners." },
      { ru: "Для исходящей почты нужны отдельные проверки SPF, DKIM и DMARC.", en: "Does not replace DKIM/DMARC/SPF checks for outbound mail." },
    ],
    useCases: [
      { ru: "Проверить домен перед настройкой корпоративной почты.", en: "Check a domain before setting up corporate email." },
      { ru: "Найти почтовые серверы без адресных записей.", en: "Find MX hosts without address records." },
      { ru: "Отличить отсутствие MX от явного отказа принимать почту через null MX.", en: "Distinguish missing MX from intentional null MX." },
    ],
    technicalNotes: [
      { ru: "Проверка ограничена DNS и не отправляет почтовые сообщения.", en: "The check is DNS-level only and does not perform SMTP transactions." },
      { ru: "Адреса серверов проверяются запросами A/AAAA без подключения к самим серверам.", en: "MX host addresses are checked through A/AAAA lookup without connecting to the mail server." },
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
    metaDescription: { ru: "Проверьте SPF в TXT-записях: дубли, механизм all, include, redirect и риск превышения лимита DNS-запросов.", en: "Check SPF TXT, duplicate SPF records, final all policy, include/redirect, and DNS lookup-limit risk." },
    h1: { ru: "Проверка SPF-записи", en: "SPF Record Checker" },
    lead: { ru: "Введите домен отправителя, чтобы проверить опубликованную SPF-политику и найти ошибки в её настройке.", en: "Enter a sender domain to check the published SPF policy and find configuration issues." },
    quickFacts: [
      { ru: "v=spf1", en: "v=spf1" },
      { ru: "include / redirect", en: "include / redirect" },
      { ru: "-all / ~all", en: "-all / ~all" },
    ],
    howToSteps: [
      { ru: "Введите домен отправителя.", en: "Enter the sender domain." },
      { ru: "Запустите проверку TXT-записей SPF.", en: "Run the SPF TXT check." },
      { ru: "Проверьте число записей, механизмы SPF, значение all и оценку числа DNS-запросов.", en: "Review SPF count, mechanisms, final all policy, and lookup risk." },
    ],
    supportedFeatures: [
      { ru: "Находит TXT-записи, начинающиеся с v=spf1.", en: "Finds v=spf1 TXT records." },
      { ru: "Отмечает ошибку, когда опубликовано несколько SPF-записей.", en: "Flags duplicate SPF records." },
      { ru: "Проверяет слишком разрешающий механизм all и оценивает число механизмов, требующих DNS-запросов.", en: "Checks permissive all policy and estimated DNS-lookup mechanisms." },
    ],
    limitations: [
      { ru: "Не раскрывает рекурсивно все цепочки include.", en: "Does not recursively expand all include chains in this batch." },
      { ru: "Не проверяет попадание писем во входящие и репутацию домена.", en: "Does not check actual inbox placement or domain reputation." },
    ],
    useCases: [
      { ru: "Найти отсутствующую SPF-запись или несколько записей вместо одной.", en: "Find missing SPF or two SPF records." },
      { ru: "Проверить использование +all или ?all.", en: "Check whether the domain is open via +all/?all." },
      { ru: "Проверить настройки отправки перед настройкой DKIM и DMARC.", en: "Review sender settings before configuring DKIM and DMARC." },
    ],
    technicalNotes: [
      { ru: "Проверка описывает опубликованную политику DNS и не подтверждает доставку писем.", en: "The tool checks DNS TXT policy and does not promise final email deliverability." },
      { ru: "Число DNS-запросов оценивается по видимым механизмам без рекурсивного раскрытия include.", en: "Lookup risk is estimated from visible mechanisms without recursive include-chain expansion." },
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
    metaDescription: { ru: "Проверьте DKIM-запись по домену и селектору: наличие TXT, тип ключа и опубликованный открытый ключ.", en: "Check a domain’s DKIM TXT record using its selector: record count, key type, and published public key." },
    h1: { ru: "Проверка DKIM-записи", en: "DKIM Record Checker" },
    lead: { ru: "Введите домен и DKIM-селектор из настроек почты, чтобы проверить публикацию открытого ключа в DNS.", en: "Enter a domain and DKIM selector to check DKIM TXT presence, key type, and public-key publication." },
    quickFacts: [
      { ru: "selector._domainkey", en: "selector._domainkey" },
      { ru: "k= / p=", en: "k= / p=" },
      { ru: "Только DNS", en: "DNS-only" },
    ],
    howToSteps: [
      { ru: "Введите домен отправителя без протокола.", en: "Enter the sender domain without a URL scheme." },
      { ru: "Укажите DKIM-селектор из настроек почтового сервиса.", en: "Enter the DKIM selector from your mail provider settings." },
      { ru: "Проверьте число записей, тип ключа и наличие открытого ключа в поле p=.", en: "Review DKIM record count, key type, and p= public key presence." },
    ],
    supportedFeatures: [
      { ru: "Запрашивает TXT-запись по адресу selector._domainkey.domain.", en: "Checks TXT record at selector._domainkey.domain." },
      { ru: "Разбирает поля DKIM и отмечает пустое значение p=.", en: "Extracts DKIM tags and flags an empty p= value." },
      { ru: "Показывает опубликованные параметры ключа.", en: "Shows the published key parameters." },
    ],
    limitations: [
      { ru: "Для проверки нужен правильный селектор: по одному домену найти все DKIM-ключи нельзя.", en: "A correct selector is required; a domain alone does not reveal DKIM." },
      { ru: "Не проверяет подписи конкретных писем и фактическое подписание исходящих сообщений.", en: "Does not check actual signing of outbound messages." },
    ],
    useCases: [
      { ru: "Проверить публикацию DKIM после настройки почтового сервиса.", en: "Verify DKIM publication after mail-service setup." },
      { ru: "Найти пустой или неполный DKIM-ключ.", en: "Find an empty or incomplete DKIM key." },
      { ru: "Сверить настройки DKIM перед настройкой DMARC.", en: "Review DKIM settings before configuring DMARC." },
    ],
    technicalNotes: [
      { ru: "Инструмент запрашивает DNS TXT и не анализирует заголовки писем.", en: "The check is limited to DNS TXT and does not analyze SMTP headers." },
      { ru: "Результат описывает публикацию записи и не подтверждает доставку писем.", en: "Status reflects record-publication quality, not final deliverability." },
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
    metaDescription: { ru: "Проверьте TXT-запись DMARC: политики p и sp, долю pct, адреса rua/ruf и параметры adkim/aspf.", en: "Check a domain’s DMARC TXT record: p and sp policies, pct, rua/ruf reporting addresses, and alignment tags." },
    h1: { ru: "Проверка DMARC-записи", en: "DMARC Record Checker" },
    lead: { ru: "Введите домен, чтобы проверить опубликованную политику DMARC, адреса отчётов и параметры согласования доменов.", en: "Enter a domain to inspect its published DMARC policy, reporting addresses, and alignment settings." },
    quickFacts: [
      { ru: "p=none/quarantine/reject", en: "p=none/quarantine/reject" },
      { ru: "rua/ruf", en: "rua/ruf" },
      { ru: "Согласование доменов", en: "alignment" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола.", en: "Enter a domain without a URL scheme." },
      { ru: "Запустите проверку TXT-записи _dmarc.", en: "Run the _dmarc TXT check." },
      { ru: "Проверьте политику, pct, адреса отчётов и параметры adkim/aspf.", en: "Review policy, pct, reporting, and alignment tags." },
    ],
    supportedFeatures: [
      { ru: "Находит записи v=DMARC1, включая ошибочную публикацию нескольких записей.", en: "Finds one or multiple v=DMARC1 records." },
      { ru: "Проверяет p, sp, pct, rua/ruf, adkim и aspf.", en: "Checks p=, sp=, pct=, rua/ruf, adkim, and aspf." },
      { ru: "Различает режим наблюдения p=none и политики quarantine/reject.", en: "Separates monitoring-only p=none from enforcement policy." },
    ],
    limitations: [
      { ru: "Не проверяет содержимое отчётов rua/ruf и доступность почтовых ящиков.", en: "Does not validate actual rua/ruf reports or mailbox availability." },
      { ru: "Не подтверждает попадание писем во входящие.", en: "Does not promise inbox placement." },
    ],
    useCases: [
      { ru: "Найти отсутствующую или дублирующуюся запись DMARC.", en: "Find missing DMARC or duplicate DMARC records." },
      { ru: "Сверить политику перед переходом на quarantine или reject.", en: "Check readiness for quarantine/reject." },
      { ru: "Проверить настройки аутентификации почты после изменений.", en: "Review email authentication settings after changes." },
    ],
    technicalNotes: [
      { ru: "Проверяется TXT-запись _dmarc.domain.", en: "The _dmarc.domain TXT record is checked at DNS level." },
      { ru: "Для прохождения DMARC домен должен быть согласован с SPF или DKIM.", en: "Passing DMARC requires domain alignment through SPF or DKIM." },
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
    metaDescription: { ru: "Проверьте публикацию DS и DNSKEY домена и алгоритмы ключей. Полная криптографическая проверка цепочки доверия не выполняется.", en: "Check published DS and DNSKEY records and key algorithms. Full cryptographic chain-of-trust validation is not performed." },
    h1: { ru: "Проверка DNSSEC домена", en: "DNSSEC Domain Checker" },
    lead: { ru: "Введите домен, чтобы узнать, доступны ли его записи DS и DNSKEY.", en: "Enter a domain to check DS and DNSKEY visibility as a DNSSEC publication check." },
    quickFacts: [
      { ru: "DS", en: "DS" },
      { ru: "DNSKEY", en: "DNSKEY" },
      { ru: "Публикация записей", en: "publication check" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола.", en: "Enter a domain without a URL scheme." },
      { ru: "Запустите проверку DS/DNSKEY.", en: "Run the DS/DNSKEY check." },
      { ru: "Проверьте наличие записей делегирования и ключей зоны.", en: "Review delegation and zone-key visibility." },
    ],
    supportedFeatures: [
      { ru: "Запрашивает DS-записи домена.", en: "Checks domain DS records." },
      { ru: "Запрашивает DNSKEY-записи домена.", en: "Checks domain DNSKEY records." },
      { ru: "Показывает алгоритмы, указанные в DNSKEY.", en: "Shows algorithms from DNSKEY publication signals." },
    ],
    limitations: [
      { ru: "Публикация записей не подтверждает криптографическую корректность всей цепочки доверия.", en: "This is not a full cryptographic chain-of-trust validation." },
      { ru: "Ответ зависит от DNS-сервиса, его кэша и TTL.", en: "The result depends on resolver behavior and current DNS cache/TTL state." },
    ],
    useCases: [
      { ru: "Узнать, опубликованы ли записи DNSSEC.", en: "Understand whether DNSSEC records are published." },
      { ru: "Найти DS без DNSKEY или DNSKEY без DS.", en: "Find DNSKEY without DS or DS without DNSKEY." },
      { ru: "Сверить публикацию записей после изменения DNSSEC.", en: "Check baseline DNSSEC hygiene for a domain." },
    ],
    technicalNotes: [
      { ru: "DS и DNSKEY запрашиваются через DNS-сервис.", en: "The tool queries DS and DNSKEY through a DNS resolver." },
      { ru: "Для полной проверки цепочки доверия нужен отдельный валидирующий DNS-сервис.", en: "Use a separate validating DNS resolver to check the full chain of trust." },
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
    metaDescription: { ru: "Проверьте срок действия SSL-сертификата, издателя, SAN и соответствие доменному имени.", en: "Check SSL certificate validity dates, issuer, SAN coverage, and hostname match for a public host." },
    h1: { ru: "Проверка SSL-сертификата", en: "SSL Certificate Checker" },
    lead: { ru: "Введите имя хоста, чтобы получить сведения о сертификате при TLS-подключении и проверить срок его действия.", en: "Enter a hostname to inspect the certificate through a single TLS handshake and get clear renewal signals." },
    quickFacts: [
      { ru: "Срок действия", en: "expiry" },
      { ru: "SAN", en: "SAN" },
      { ru: "Соответствие домену", en: "hostname match" },
    ],
    howToSteps: [
      { ru: "Введите имя хоста без https:// и пути.", en: "Enter a hostname without https:// or a path." },
      { ru: "Запустите SSL-проверку.", en: "Run the SSL check." },
      { ru: "Проверьте срок действия, издателя, SAN и соответствие имени хоста.", en: "Review expiry, issuer, SAN, and hostname match." },
    ],
    supportedFeatures: [
      { ru: "Показывает срок действия сертификата и число дней до его истечения.", en: "Checks certificate validity and days until expiry." },
      { ru: "Показывает издателя, поле CN и список доменов в SAN.", en: "Shows issuer, subject CN, and SAN coverage." },
      { ru: "Отклоняет URL, IP-адреса, локальные и частные адреса.", en: "Rejects URLs, IP literals, and local/private targets." },
    ],
    limitations: [
      { ru: "Результат получен за одно TLS-подключение и не заменяет полный аудит SSL.", en: "This is a single TLS handshake, not a full SSL Labs audit." },
      { ru: "Не проверяет OCSP, журналы Certificate Transparency и все свойства цепочки сертификатов.", en: "Does not check OCSP, Certificate Transparency logs, or every property of the certificate chain." },
    ],
    useCases: [
      { ru: "Проверить, не истекает ли сертификат сайта.", en: "Check whether a site certificate is close to expiry." },
      { ru: "Найти несоответствие имени хоста после настройки CDN или обратного прокси.", en: "Find hostname mismatch after CDN or reverse-proxy setup." },
      { ru: "Сверить срок действия после продления сертификата.", en: "Verify validity dates after renewing a certificate." },
    ],
    technicalNotes: [
      { ru: "Подключение выполняется к публичному имени хоста с SNI; ввод IP-адреса не поддерживается.", en: "The tool connects to a public hostname with SNI and does not accept IP literals." },
      { ru: "Корректный сертификат сам по себе не подтверждает безопасность сайта.", en: "A valid certificate alone does not establish that a site is secure." },
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
    metaDescription: { ru: "Проверьте согласованную версию TLS, набор шифров, протокол ALPN и основные сведения о сертификате.", en: "Check TLS version, cipher suite, ALPN/HTTP2 signal, and certificate health through a limited handshake." },
    h1: { ru: "Проверка TLS-конфигурации", en: "TLS Configuration Checker" },
    lead: { ru: "Введите имя хоста, чтобы узнать параметры одного TLS-подключения с современными настройками клиента.", en: "Enter a hostname to inspect one TLS connection made with modern client settings." },
    quickFacts: [
      { ru: "TLS 1.2 / 1.3", en: "TLS 1.2 / 1.3" },
      { ru: "Набор шифров", en: "cipher" },
      { ru: "ALPN", en: "ALPN" },
    ],
    howToSteps: [
      { ru: "Введите имя хоста и порт.", en: "Enter hostname and port." },
      { ru: "Запустите TLS-проверку.", en: "Run the TLS check." },
      { ru: "Проверьте согласованные протокол, набор шифров и сведения о сертификате.", en: "Review negotiated protocol, cipher, and certificate signals." },
    ],
    supportedFeatures: [
      { ru: "Показывает согласованную версию TLS и набор шифров.", en: "Shows negotiated TLS version and cipher suite." },
      { ru: "Показывает протокол, выбранный через ALPN, включая h2.", en: "Shows ALPN negotiated protocol, including h2 signal." },
      { ru: "Дополняет параметры соединения основными сведениями о сертификате.", en: "Connects TLS signals with baseline certificate health." },
    ],
    limitations: [
      { ru: "Не перебирает все наборы шифров и устаревшие версии протокола.", en: "Does not enumerate all cipher suites and legacy protocols." },
      { ru: "Не выполняет полное сканирование уязвимостей.", en: "Is not a full vulnerability scanner." },
    ],
    useCases: [
      { ru: "Узнать, какую версию TLS выбирает сервер при таком подключении.", en: "Understand which TLS version is actually negotiated for a site." },
      { ru: "Проверить согласование HTTP/2 через ALPN.", en: "Find missing HTTP/2 ALPN signal." },
      { ru: "Сверить настройки TLS перед публикацией сайта.", en: "Review TLS settings before publishing a site." },
    ],
    technicalNotes: [
      { ru: "Результат относится к одному соединению с современными настройками клиента.", en: "The result is based on one handshake with a modern client context." },
      { ru: "Для проверки всех сочетаний протоколов и шифров нужен отдельный TLS-сканер.", en: "Use a dedicated TLS scanner to check all protocol and cipher combinations." },
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
    metaDescription: { ru: "Проверьте Content-Encoding, Vary: Accept-Encoding и наличие сжатия для текстовых ответов HTML, CSS, JS и JSON.", en: "Check Content-Encoding, Vary: Accept-Encoding, and compressible content type for HTML/CSS/JS/JSON responses." },
    h1: { ru: "Проверка HTTP-сжатия", en: "HTTP Compression Checker" },
    lead: { ru: "Введите URL, чтобы проверить сжатие gzip, Brotli или deflate и заголовок Vary, влияющий на кэширование разных версий ответа.", en: "Enter a URL to check gzip/Brotli/deflate compression and cache-safe Vary behavior." },
    quickFacts: [
      { ru: "gzip / br", en: "gzip / br" },
      { ru: "Vary", en: "Vary" },
      { ru: "Текстовые ресурсы", en: "text assets" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTP(S) URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите проверку сжатия.", en: "Run the compression policy check." },
      { ru: "Проверьте Content-Encoding, тип содержимого и Vary.", en: "Review Content-Encoding, content type, and Vary header." },
    ],
    supportedFeatures: [
      { ru: "Читает Content-Encoding и определяет ответы, для которых применимо текстовое сжатие.", en: "Checks Content-Encoding and compressible candidate response." },
      { ru: "Проверяет Vary: Accept-Encoding для корректного кэширования вариантов ответа.", en: "Checks Vary: Accept-Encoding for shared-cache correctness." },
      { ru: "Загружает публичный URL с защитой от обращений к локальным и частным адресам.", en: "Fetches public URLs with protection against requests to local and private addresses." },
    ],
    limitations: [
      { ru: "Проверяется один ответ, а не загрузка всех ресурсов страницы.", en: "This is a single-response check, not a full waterfall audit of all assets." },
      { ru: "Для измерения загрузки страницы нужна отдельная проверка производительности.", en: "PageSpeed and browser waterfall belong to separate performance tools." },
    ],
    useCases: [
      { ru: "Найти несжатый ответ HTML, CSS или JS.", en: "Find an uncompressed HTML/CSS/JS response." },
      { ru: "Проверить Vary при настройке CDN и кэша.", en: "Check Vary before CDN/cache configuration." },
      { ru: "Проверить сжатие перед оптимизацией скорости страницы.", en: "Prepare a site for speed/Core Web Vitals optimization." },
    ],
    technicalNotes: [
      { ru: "Проверка заголовков не строит диаграмму сетевых запросов и не скачивает большое тело ответа.", en: "The tool does not download a large body and does not build a network waterfall." },
      { ru: "Для сводки размеров ресурсов используйте анализ веса страницы; для измерений загрузки — Google PageSpeed.", en: "Use Page Weight Analyzer and PageSpeed Checker for full page-weight evaluation." },
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
    metaDescription: { ru: "Проверьте заголовки ответа: HTTP-статус, редиректы, Server, X-Powered-By, кэширование и тип содержимого.", en: "Check page response headers: status, redirects, Server/X-Powered-By, cache, and content metadata." },
    h1: { ru: "Анализ HTTP-заголовков", en: "HTTP Headers Analyzer" },
    lead: { ru: "Введите URL, чтобы увидеть заголовки ответа и замечания по кэшированию, содержимому и раскрытию сведений о сервере.", en: "Enter a URL to inspect response headers and findings about caching, content, and server technology disclosure." },
    quickFacts: [
      { ru: "Заголовки ответа", en: "response headers" },
      { ru: "Кэш и содержимое", en: "cache/content" },
      { ru: "Один ответ", en: "single response" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTP(S) URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите анализ HTTP-заголовков.", en: "Run the HTTP header analysis." },
      { ru: "Проверьте заголовки кэша и содержимого, а также сведения о серверных технологиях.", en: "Review disclosure, cache/content metadata, and raw headers." },
    ],
    supportedFeatures: [
      { ru: "Показывает HTTP-статус, редиректы и число заголовков.", en: "Shows status, redirects, and header count." },
      { ru: "Отмечает раскрытие технологий в Server и X-Powered-By.", en: "Flags Server and X-Powered-By disclosure." },
      { ru: "Показывает Cache-Control, Content-Type, Content-Encoding и Vary.", en: "Shows cache-control, content-type, encoding, and Vary." },
    ],
    limitations: [
      { ru: "Результат относится к одному ответу; обход сайта и измерение загрузки ресурсов не выполняются.", en: "This is a single-response check, not a crawler or waterfall." },
      { ru: "Заголовки безопасности оцениваются отдельным инструментом.", en: "Security headers are evaluated by a separate dedicated tool." },
    ],
    useCases: [
      { ru: "Посмотреть заголовки ответа публичной страницы.", en: "Quickly inspect the full response header set." },
      { ru: "Найти лишние сведения о технологиях сервера.", en: "Find unnecessary technology disclosure in headers." },
      { ru: "Сверить настройки перед изменением CDN или кэша.", en: "Prepare data for CDN/cache configuration." },
    ],
    technicalNotes: [
      { ru: "Запрос ограничен по времени и размеру ответа и защищён от обращений к частным адресам.", en: "Limits request time and response size, with protection against requests to private addresses." },
      { ru: "Заголовки отражают ответ сервера на момент проверки.", en: "The result reflects one response at check time." },
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
    metaDescription: { ru: "Проверьте согласование HTTP/2 через ALPN и объявление HTTP/3 в Alt-Svc. QUIC-подключение не выполняется.", en: "Check HTTP/2 negotiation through ALPN and HTTP/3 advertisement in Alt-Svc. No QUIC connection is made." },
    h1: { ru: "Проверка HTTP/2 и HTTP/3", en: "HTTP/2 and HTTP/3 Checker" },
    lead: { ru: "Введите URL, чтобы проверить, согласуется ли HTTP/2 при TLS-подключении и объявляет ли сервер поддержку HTTP/3.", en: "Enter a URL to check negotiated HTTP/2 signal and HTTP/3 Alt-Svc advertisement." },
    quickFacts: [
      { ru: "ALPN", en: "ALPN" },
      { ru: "Alt-Svc", en: "Alt-Svc" },
      { ru: "Одно подключение", en: "limited" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTPS URL.", en: "Enter a public HTTPS URL." },
      { ru: "Запустите проверку протоколов.", en: "Run the protocol check." },
      { ru: "Проверьте h2 в результате ALPN и h3 в заголовке Alt-Svc.", en: "Review ALPN h2 and Alt-Svc h3 signals." },
    ],
    supportedFeatures: [
      { ru: "Проверяет согласование HTTP/2 через TLS ALPN.", en: "Checks HTTP/2 through TLS ALPN negotiation." },
      { ru: "Ищет объявление HTTP/3 в заголовке Alt-Svc.", en: "Checks HTTP/3 advertisement through the Alt-Svc header." },
      { ru: "Показывает версию TLS, использованную при подключении.", en: "Shows TLS version context." },
    ],
    limitations: [
      { ru: "Не выполняет QUIC-подключение; объявление HTTP/3 не подтверждает его работоспособность.", en: "Does not perform a QUIC handshake or claim full HTTP/3 validation." },
      { ru: "Не проверяет все варианты CDN и настройки для разных клиентов.", en: "Does not enumerate all CDN/protocol variants." },
    ],
    useCases: [
      { ru: "Узнать, доступен ли HTTP/2 при подключении современного клиента.", en: "Understand whether the site serves HTTP/2 to a modern client." },
      { ru: "Проверить объявление HTTP/3 после настройки CDN.", en: "Check whether HTTP/3 is advertised through a CDN." },
      { ru: "Сверить протоколы перед проверкой производительности.", en: "Review protocol settings before a performance audit." },
    ],
    technicalNotes: [
      { ru: "HTTP/2 определяется по результату ALPN при TLS-подключении.", en: "HTTP/2 is detected from the TLS handshake ALPN result." },
      { ru: "Для HTTP/3 проверяется только объявление в Alt-Svc.", en: "HTTP/3 is detected only as an advertised signal in Alt-Svc." },
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
    metaDescription: { ru: "Проверьте Access-Control-Allow-Origin, разрешение учётных данных, Vary: Origin и сочетание wildcard с credentials.", en: "Check Access-Control-Allow-Origin, credentials, Vary: Origin, and wildcard risks for a given Origin." },
    h1: { ru: "Проверка CORS-заголовков", en: "CORS Header Checker" },
    lead: { ru: "Введите URL API и Origin, чтобы проверить CORS-заголовки ответа для указанного источника запроса.", en: "Enter an API URL and Origin to check CORS response headers for that request source." },
    quickFacts: [
      { ru: "Access-Control-Allow-Origin", en: "ACAO" },
      { ru: "Учётные данные", en: "credentials" },
      { ru: "Vary: Origin", en: "Vary: Origin" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL ресурса.", en: "Enter a public resource URL." },
      { ru: "Укажите Origin, доступ с которого нужно проверить.", en: "Enter the Origin to test." },
      { ru: "Проверьте разрешённый источник, учётные данные и разделение кэша по Origin.", en: "Review ACAO, credentials, and cache variation." },
    ],
    supportedFeatures: [
      { ru: "Отправляет HTTP-запрос с заданным заголовком Origin.", en: "Sends a safe request with an Origin header." },
      { ru: "Проверяет несовместимое сочетание wildcard и разрешения учётных данных.", en: "Checks wildcard + credentials misconfiguration." },
      { ru: "Проверяет Vary: Origin, влияющий на кэширование ответов для разных источников.", en: "Flags Vary: Origin for cache correctness." },
    ],
    limitations: [
      { ru: "Не проверяет предварительные запросы браузера для всех HTTP-методов.", en: "Does not execute a browser preflight matrix for all methods." },
      { ru: "Не обращается к частным и внутренним адресам.", en: "Does not test private/internal endpoints." },
    ],
    useCases: [
      { ru: "Проверить доступ для конкретного Origin веб-приложения.", en: "Check whether a specific frontend Origin is allowed." },
      { ru: "Найти ошибочное сочетание wildcard и credentials.", en: "Find dangerous wildcard with credentials." },
      { ru: "Сверить CORS при настройке кэширования API на CDN.", en: "Prepare an API for safe CDN/cache behavior." },
    ],
    technicalNotes: [
      { ru: "Проверка не воспроизводит полностью правила CORS в браузере.", en: "The check is not full browser CORS emulation." },
      { ru: "Результат относится к одному HTTP-запросу с заданным Origin.", en: "The result is based on one safe HTTP request with the given Origin." },
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
    metaDescription: { ru: "Разберите метрики заголовка Server-Timing: имена, длительность dur и описания desc в одном HTTP-ответе.", en: "Inspect Server-Timing metrics, names, duration values, and descriptions from a single HTTP response." },
    h1: { ru: "Анализ Server-Timing", en: "Server-Timing Analyzer" },
    lead: { ru: "Введите URL, чтобы увидеть метрики времени, которые сервер публикует в заголовке Server-Timing.", en: "Enter a URL to parse the Server-Timing header and inspect backend timing signals exposed to clients." },
    quickFacts: [
      { ru: "Server-Timing", en: "Server-Timing" },
      { ru: "dur / desc", en: "dur / desc" },
      { ru: "Один ответ", en: "single response" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTP(S) URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите анализ заголовков ответа.", en: "Run response-header analysis." },
      { ru: "Проверьте имена метрик, длительность и описания.", en: "Review metric names, duration, and description values." },
    ],
    supportedFeatures: [
      { ru: "Разбирает метрики заголовка Server-Timing.", en: "Parses Server-Timing header metrics." },
      { ru: "Показывает параметры dur и desc.", en: "Shows dur= and desc= parameters." },
      { ru: "Представляет опубликованные сервером значения в одном отчёте.", en: "Presents values published by the server in one report." },
    ],
    limitations: [
      { ru: "Не измеряет самостоятельно время выполнения серверных операций.", en: "Does not measure actual backend operation duration." },
      { ru: "Проверяет только один HTTP-ответ.", en: "Checks only one HTTP response." },
    ],
    useCases: [
      { ru: "Узнать, публикует ли сервер метрики времени.", en: "Check whether backend timing metrics are published." },
      { ru: "Проверить наличие Server-Timing перед анализом производительности.", en: "Find missing Server-Timing before performance work." },
      { ru: "Сверить формат метрик после релиза.", en: "Validate metric formatting after a release." },
    ],
    technicalNotes: [
      { ru: "Значения берутся из заголовка ответа и не являются независимым измерением.", en: "The tool reads a header, not a synthetic benchmark." },
      { ru: "Ответ зависит от выбранного URL, кэша и CDN.", en: "The response depends on the URL, caching, and CDN." },
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
    seoTitle: { ru: "Проверка атрибутов cookie", en: "Cookie Attribute Checker" },
    metaDescription: { ru: "Проверьте атрибуты Set-Cookie: Secure, HttpOnly, SameSite, Max-Age и Expires в одном ответе сервера.", en: "Check Set-Cookie attributes: Secure, HttpOnly, SameSite, persistent cookies, and baseline issues for one response." },
    h1: { ru: "Проверка атрибутов cookie", en: "Cookie Attribute Checker" },
    lead: { ru: "Введите URL, чтобы проверить настройки cookie, которые сервер устанавливает заголовками Set-Cookie.", en: "Enter a URL to inspect Set-Cookie headers without browser session tracking or consent-banner analysis." },
    quickFacts: [
      { ru: "Secure", en: "Secure" },
      { ru: "HttpOnly", en: "HttpOnly" },
      { ru: "SameSite", en: "SameSite" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL.", en: "Enter a public URL." },
      { ru: "Запустите проверку cookie.", en: "Run the cookie policy check." },
      { ru: "Проверьте число Set-Cookie, атрибуты и найденные замечания.", en: "Review Set-Cookie count, attributes, and issues." },
    ],
    supportedFeatures: [
      { ru: "Проверяет Secure, HttpOnly и SameSite.", en: "Checks Secure, HttpOnly, and SameSite." },
      { ru: "Отмечает SameSite=None без Secure.", en: "Flags SameSite=None without Secure." },
      { ru: "Определяет долгоживущие cookie по Max-Age и Expires.", en: "Marks persistent cookies by Max-Age/Expires." },
    ],
    limitations: [
      { ru: "Не взаимодействует с баннером согласия и не оценивает юридическую корректность согласия.", en: "Does not click cookie banners or analyze legal consent." },
      { ru: "Проверяет только заголовки Set-Cookie одного ответа.", en: "Checks only Set-Cookie headers from one response." },
    ],
    useCases: [
      { ru: "Найти cookie без Secure или HttpOnly.", en: "Find cookies missing Secure or HttpOnly." },
      { ru: "Сверить SameSite после релиза.", en: "Check SameSite policy after release." },
      { ru: "Проверить основные атрибуты перед аудитом безопасности.", en: "Prepare a baseline for security review." },
    ],
    technicalNotes: [
      { ru: "Проверка атрибутов не подтверждает соответствие баннера cookie законодательству.", en: "The tool does not assess legal compliance of cookie banners." },
      { ru: "Cookie, создаваемые JavaScript или после входа, могут отсутствовать в этом ответе.", en: "Some cookies may appear only after JavaScript or login flows." },
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
    metaDescription: { ru: "Найдите ссылки на ресурсы по HTTP в исходном HTML страницы HTTPS: скрипты, стили, изображения, фреймы и медиа.", en: "Find HTTP subresource candidates inside HTTPS HTML: scripts, iframes, stylesheets, images, media, and srcset." },
    h1: { ru: "Проверка смешанного контента", en: "Mixed Content Checker" },
    lead: { ru: "Введите HTTPS URL, чтобы найти в исходном HTML ресурсы, подключённые по незащищённому HTTP.", en: "Enter an HTTPS URL to find static HTML mixed-content candidates without browser runtime DOM or CSS crawling." },
    quickFacts: [
      { ru: "Активный и пассивный контент", en: "active/passive" },
      { ru: "Исходный HTML", en: "static HTML" },
      { ru: "Страница HTTPS", en: "HTTPS page" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTPS URL.", en: "Enter a public HTTPS URL." },
      { ru: "Запустите проверку смешанного контента.", en: "Run the mixed-content scan." },
      { ru: "Проверьте найденные активные и пассивные ресурсы по HTTP.", en: "Review active and passive HTTP subresources." },
    ],
    supportedFeatures: [
      { ru: "Проверяет script, iframe, object, embed и ссылки на файлы стилей.", en: "Checks script, iframe, object, embed, and stylesheet." },
      { ru: "Проверяет img, audio, video, source, poster и srcset.", en: "Checks img, audio, video, source, poster, and srcset." },
      { ru: "Разделяет активный и пассивный смешанный контент.", en: "Separates active and passive mixed content." },
    ],
    limitations: [
      { ru: "Не выполняет JavaScript и не строит DOM в браузере.", en: "Does not execute JavaScript or build a browser DOM." },
      { ru: "Не проверяет фоновые изображения из CSS и ресурсы, добавленные JavaScript.", en: "Does not scan CSS background-image or runtime assets." },
    ],
    useCases: [
      { ru: "Найти HTTP-ресурсы при переходе на HTTPS.", en: "Find HTTP resources before HTTPS migration." },
      { ru: "Проверить шаблон после смены CDN или домена ресурсов.", en: "Check a template after changing CDN/assets host." },
      { ru: "Найти активный смешанный контент на опубликованных страницах.", en: "Remove active mixed content from production pages." },
    ],
    technicalNotes: [
      { ru: "Результат основан на разборе исходного HTML с ограничением размера ответа.", en: "The result is based on limited static HTML parsing." },
      { ru: "Фактическую блокировку или автоматическое обновление ресурсов нужно проверять в браузере.", en: "Check actual resource blocking or automatic upgrading separately in a browser." },
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
    metaDescription: { ru: "Разберите CSP из заголовков и HTML: директивы, Report-Only, unsafe-inline, unsafe-eval и слишком широкие источники.", en: "Parse CSP headers, Report-Only, and static meta policies: directives, unsafe-inline, unsafe-eval, wildcard sources, and key restrictions." },
    h1: { ru: "Анализ Content Security Policy", en: "Content Security Policy Analyzer" },
    lead: { ru: "Введите URL, чтобы проверить опубликованные правила CSP и найти потенциально рискованные разрешения.", en: "Enter a URL to inspect published CSP rules and identify potentially risky permissions." },
    quickFacts: [
      { ru: "Заголовки и метатег", en: "header + meta" },
      { ru: "Report-Only", en: "Report-Only" },
      { ru: "Директивы и источники", en: "directives and sources" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTP(S) URL.", en: "Enter a public http/https URL." },
      { ru: "Запустите разбор заголовков CSP и метатега в HTML.", en: "Run CSP response-header and static-meta parsing." },
      { ru: "Проверьте источники, отсутствующие директивы и ограничения политики в метатеге.", en: "Review risky sources, missing directives, and meta-policy limits." },
    ],
    supportedFeatures: [
      { ru: "Разбирает действующую CSP, Report-Only и политику в метатеге.", en: "Parses enforced CSP, Report-Only, and meta CSP." },
      { ru: "Показывает директивы, значения и повторяющиеся объявления.", en: "Shows directives, values, and duplicate directives." },
      { ru: "Отмечает unsafe-inline, unsafe-eval, wildcard и отсутствие ключевых директив.", en: "Flags unsafe-inline, unsafe-eval, wildcard, and missing key directives." },
    ],
    limitations: [
      { ru: "Не выполняет JavaScript и не наблюдает нарушения CSP в браузере.", en: "Does not execute JavaScript or observe browser CSP violations." },
      { ru: "Не подтверждает отсутствие XSS, обходов CSP и ошибок серверной логики.", en: "Does not prove the absence of XSS, bypasses, or server-side logic flaws." },
    ],
    useCases: [
      { ru: "Проверить CSP после изменения CDN, аналитики или скриптов приложения.", en: "Check CSP after changing CDN, analytics, or frontend bundles." },
      { ru: "Найти слишком широкие разрешения перед ужесточением политики.", en: "Find overly broad source expressions before hardening." },
      { ru: "Сравнить действующую политику и правила Report-Only.", en: "Compare enforced and Report-Only rollout signals." },
    ],
    technicalNotes: [
      { ru: "Политика в метатеге имеет ограничения: например, frame-ancestors требует HTTP-заголовка.", en: "Meta CSP has limitations and does not replace the HTTP header for frame-ancestors." },
      { ru: "Перед ужесточением политики проверьте нужные ресурсы в режиме Report-Only.", en: "Policy tightening should use a report-only rollout and validation of actual resources." },
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
    metaDescription: { ru: "Сравните ответы Cloudflare, Google Public DNS, Quad9 и OpenDNS для одного типа DNS-записи.", en: "Compare answers from Cloudflare, Google Public DNS, Quad9, and OpenDNS for one DNS record type." },
    h1: { ru: "Сравнение DNS-резолверов", en: "DNS Resolver Comparison" },
    lead: { ru: "Введите домен и тип записи, чтобы сравнить ответы четырёх DNS-сервисов на момент проверки: значения, ошибки и различия между наборами записей.", en: "Enter a domain and record type to compare limited backend snapshots from four recursive resolvers: answers, errors, and distinct answer sets." },
    quickFacts: [
      { ru: "4 DNS-сервиса", en: "4 resolvers" },
      { ru: "Один тип записи", en: "1 record type" },
      { ru: "Ответы на момент запроса", en: "backend snapshot" },
    ],
    howToSteps: [
      { ru: "Введите домен без протокола и пути.", en: "Enter a domain without protocol or path." },
      { ru: "Выберите A, AAAA, CNAME, MX, NS или TXT.", en: "Choose A, AAAA, CNAME, MX, NS, or TXT." },
      { ru: "Сравните наборы записей, ошибки отдельных запросов и TTL.", en: "Compare answer sets, partial errors, and TTLs." },
    ],
    supportedFeatures: [
      { ru: "Параллельно запрашивает четыре заданных публичных DNS-сервиса.", en: "Queries four fixed public recursive resolvers in parallel." },
      { ru: "Сравнивает значения и приоритеты MX без учёта различий TTL.", en: "Compares values and MX priority while ignoring TTL differences." },
      { ru: "Показывает время ответа DNS-сервиса на запрос сервера WebDiag.", en: "Shows backend-to-resolver latency as a diagnostic signal." },
    ],
    limitations: [
      { ru: "Четыре ответа не подтверждают распространение изменений по всем сетям.", en: "This is not global monitoring of every DNS cache and does not prove propagation." },
      { ru: "Время ответа измеряется от сервера WebDiag, а не от устройства пользователя.", en: "Latency is measured from the WebDiag backend, not the user's device." },
    ],
    useCases: [
      { ru: "Сравнить ответы DNS-сервисов после изменения записей.", en: "Compare cache state after a DNS change." },
      { ru: "Найти различия в ответах или запросы, не завершившиеся вовремя.", en: "Find resolver-specific mismatches or partial timeouts." },
      { ru: "Проверить один тип записи без полного аудита DNS-зоны.", en: "Check one record type without a full zone audit." },
    ],
    technicalNotes: [
      { ru: "Ответы зависят от TTL, кэша DNS-сервиса и времени запроса.", en: "Resolver snapshots depend on TTL, recursive cache, and request time." },
      { ru: "Для проверки исходной настройки сверьте данные авторитетных DNS-серверов.", en: "Authoritative nameservers should be checked for final verification." },
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
    metaDescription: { ru: "Получите данные реестра домена по RDAP: статусы, даты, DNS-серверы, регистратора и контакт для жалоб.", en: "Retrieve registry RDAP data through IANA bootstrap: statuses, events, nameservers, registrar, and abuse contact without WHOIS scraping." },
    h1: { ru: "RDAP-проверка домена", en: "Domain RDAP Lookup" },
    lead: { ru: "Введите домен, чтобы получить опубликованные реестром регистрационные сведения через RDAP.", en: "Enter a domain to retrieve the registration details published by its registry through RDAP." },
    quickFacts: [
      { ru: "Каталог IANA", en: "IANA bootstrap" },
      { ru: "Данные реестра", en: "registry RDAP" },
      { ru: "Без личных контактов владельца", en: "no registrant PII" },
    ],
    howToSteps: [
      { ru: "Введите домен без URL-схемы.", en: "Enter a domain without a URL scheme." },
      { ru: "Запустите RDAP-проверку.", en: "Run the RDAP lookup." },
      { ru: "Проверьте статусы, даты, DNS-серверы, регистратора и сведения о подписании делегирования DNSSEC.", en: "Review statuses, events, nameservers, registrar, and the DNSSEC delegation signal." },
    ],
    supportedFeatures: [
      { ru: "Находит RDAP-сервис реестра через каталог IANA.", en: "Finds the authoritative RDAP service through the IANA DNS bootstrap." },
      { ru: "Показывает доступные даты, DNS-серверы, регистратора и контакт для жалоб в пределах размера отчёта.", en: "Shows limited events, nameservers, registrar, and abuse contact." },
      { ru: "Не выводит личные контактные данные владельца домена.", en: "Does not display registrant personal contact data." },
    ],
    limitations: [
      { ru: "Ответ RDAP 404 не подтверждает, что домен доступен для регистрации.", en: "RDAP 404 does not prove a domain is available for registration." },
      { ru: "Сведения реестра не подтверждают фактическое владение, безопасность или репутацию домена.", en: "Registry data does not confirm actual ownership, safety, or domain reputation." },
    ],
    useCases: [
      { ru: "Сверить даты регистрации и окончания срока, если реестр их публикует.", en: "Review domain registration/expiration events and statuses." },
      { ru: "Найти регистратора и опубликованный контакт для жалоб.", en: "Find the registrar and published abuse contact." },
      { ru: "Сверить DNS-серверы и поле delegationSigned.", en: "Review nameservers and the delegationSigned signal." },
    ],
    technicalNotes: [
      { ru: "Данные берутся из RDAP JSON; текстовые ответы WHOIS не разбираются.", en: "The tool uses RDAP JSON and does not parse non-standard legacy WHOIS text." },
      { ru: "Запросы к каталогу IANA и RDAP ограничены по времени и размеру и защищены от обращений к частным адресам.", en: "Bootstrap and RDAP responses use limited safe HTTP fetching." },
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
    metaDescription: { ru: "Проверьте сведения реестра о публичном IPv4/IPv6: диапазон, CIDR, идентификатор сети, статусы и контакт для жалоб.", en: "Check registry allocation data for a public IPv4/IPv6 address through IANA RDAP bootstrap: range, CIDR, handle, statuses, and abuse contact." },
    h1: { ru: "RDAP-информация об IP-сети", en: "IP RDAP Network Lookup" },
    lead: { ru: "Введите публичный IP-адрес, чтобы получить регистрационные сведения о выделенной сети. Они не определяют местоположение или текущего пользователя адреса.", en: "Enter a public IP to retrieve network registration details. These do not identify the address’s current user or location." },
    quickFacts: [
      { ru: "IPv4 / IPv6", en: "IPv4 / IPv6" },
      { ru: "Диапазон и CIDR", en: "range + CIDR" },
      { ru: "Без геолокации", en: "not geolocation" },
    ],
    howToSteps: [
      { ru: "Введите публичный IPv4- или IPv6-адрес.", en: "Enter a public global IP address." },
      { ru: "Запустите RDAP-проверку IP.", en: "Run the IP RDAP lookup." },
      { ru: "Проверьте диапазон, CIDR, идентификатор сети, статусы и контакт для жалоб.", en: "Review the allocation range, CIDR, network handle, statuses, and abuse contact." },
    ],
    supportedFeatures: [
      { ru: "Выбирает RDAP-сервис через каталог IANA по наиболее точному совпадению сетевого префикса.", en: "Uses IANA IPv4/IPv6 RDAP bootstrap and the most-specific prefix match." },
      { ru: "Показывает диапазон реестра, CIDR0, идентификатор, тип и поле страны.", en: "Shows registry range, CIDR0, handle, type, and country field." },
      { ru: "Отклоняет частные, локальные и другие неглобальные IP-адреса.", en: "Rejects private, loopback, and other non-global IP addresses." },
    ],
    limitations: [
      { ru: "Поле страны относится к регистрации сети и не определяет местоположение устройства.", en: "The country field belongs to the allocation record and is not precise device geolocation." },
      { ru: "Не проверяет репутацию, маршрутизацию ASN, обратный DNS и пользователя конкретного соединения.", en: "The tool does not check reputation, ASN routing, reverse DNS, or the owner of a specific connection." },
    ],
    useCases: [
      { ru: "Определить зарегистрированный диапазон сети при разборе инцидента.", en: "Identify the registry network range during incident triage." },
      { ru: "Найти опубликованный контакт для жалоб на действия из сети.", en: "Find the network's published abuse contact." },
      { ru: "Сверить CIDR и идентификатор выделенного диапазона.", en: "Review CIDR and allocation handle without a commercial IP API." },
    ],
    technicalNotes: [
      { ru: "Результат описывает выделение адресов реестром и может не отражать текущую маршрутизацию или аренду.", en: "The result describes RIR/registry allocation and may not reflect current routing or address leasing." },
      { ru: "Запросы к каталогу IANA и RDAP ограничены по времени и размеру и защищены от обращений к частным адресам.", en: "IP and RDAP bootstrap URLs use limited safe HTTP fetching." },
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
    metaDescription: { ru: "Разберите PEM-цепочку X.509 в браузере: владелец, издатель, сроки, SAN, алгоритмы и отпечатки SHA-256 без отправки сертификатов на сервер.", en: "Inspect a PEM X.509 chain locally: subject, issuer, validity, SANs, algorithms, and SHA-256 fingerprints without uploading certificates." },
    h1: { ru: "Просмотр PEM X.509-сертификатов", en: "PEM X.509 Certificate Viewer" },
    lead: { ru: "Вставьте публичные сертификаты, чтобы проверить их сведения и порядок цепочки локально в браузере. Сетевая проверка доверия не выполняется.", en: "Paste one or more public certificates to inspect their structure and chain order locally in your browser without network validation." },
    quickFacts: [{ ru: "До 20 сертификатов", en: "Up to 20 certificates" }, { ru: "Отпечаток SHA-256", en: "SHA-256 fingerprint" }, { ru: "Без отправки на сервер", en: "No upload" }],
    howToSteps: [{ ru: "Вставьте PEM-блоки CERTIFICATE.", en: "Paste PEM CERTIFICATE blocks." }, { ru: "Запустите разбор сертификатов.", en: "Run the local inspection." }, { ru: "Проверьте владельца, издателя, сроки, SAN и порядок цепочки.", en: "Review subject, issuer, validity, SANs, and chain order." }],
    supportedFeatures: [{ ru: "Разбирает структуру X.509 в формате DER/ASN.1 с ограничением размера.", en: "Parses limited DER/ASN.1 X.509 certificate structures." }, { ru: "Показывает серийный номер, алгоритмы ключа и подписи, Basic Constraints и SAN.", en: "Shows serial, key and signature algorithms, Basic Constraints, and SANs." }, { ru: "Вычисляет отпечатки SHA-256 через Web Crypto.", en: "Calculates SHA-256 fingerprints through Web Crypto." }],
    limitations: [{ ru: "Не проверяет имя хоста, OCSP, CRL, хранилище доверия и цепочку через сеть.", en: "Does not perform hostname verification, OCSP, CRL, trust-store, or network chain validation." }, { ru: "Запросы CSR и закрытые ключи отклоняются.", en: "CSRs and private keys are intentionally rejected." }],
    useCases: [{ ru: "Проверить публичный сертификат перед установкой.", en: "Inspect a public certificate before installation." }, { ru: "Сверить домены в SAN и сроки действия.", en: "Review SANs and validity dates." }, { ru: "Сравнить отпечаток SHA-256 без сетевого запроса.", en: "Compare a SHA-256 fingerprint offline." }],
    technicalNotes: [{ ru: "Лимиты ввода: 1 000 000 символов, 20 сертификатов и 256 000 байт DER на сертификат.", en: "Input is limited to 1,000,000 characters, 20 certificates, and 256,000 DER bytes per certificate." }, { ru: "Разбор содержимого сертификата не подтверждает доверие к нему.", en: "The result is an inspection, not proof that a certificate is trusted." }],
    faq: [
      { question: { ru: "Какие данные можно вставить для просмотра сертификата?", en: "What can I paste to inspect a certificate?" }, answer: { ru: "Вставьте открытый сертификат в текстовом формате PEM с блоком BEGIN CERTIFICATE. Закрытые ключи здесь не нужны: инструмент отклоняет их. Используйте только публичную часть сертификата.", en: "Paste a public certificate in text PEM format with a BEGIN CERTIFICATE block. Private keys are not needed and are rejected by this tool. Use only the public certificate." } },
      { question: { ru: "Можно ли по этому отчёту понять, доверяет ли браузер сертификату?", en: "Can this report establish whether a browser trusts the certificate?" }, answer: { ru: "Отчёт показывает сведения из вставленного сертификата без подключения к сайту. Он не проверяет доверие браузера или установку сертификата на сервере. Для проверки действующего сайта используйте инструмент проверки SSL-сертификата.", en: "The report shows details from the pasted certificate without connecting to a site. It does not check browser trust or server installation. Use the SSL certificate checker to inspect a live site." } }
    ],
    relatedToolSlugs: ["ssl-certificate-checker", "tls-configuration-checker", "security-headers-checker"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc5280", "https://www.rfc-editor.org/rfc/rfc7468"],
  }),

] as const;
