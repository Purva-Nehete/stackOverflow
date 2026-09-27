import { supportedLocales, type Locale } from "./config";

export const translations: Record<Locale, Record<string, string>> = {
  en: {
    "common.loading": "Loading...",
    "common.error": "Something went wrong.",
    "common.cancel": "Cancel",
    "common.save": "Save",
    "navigation.community": "Community",
    "navigation.subscription": "Subscription",
    "navigation.login": "Log in",
    "navigation.logout": "Log out",
    "settings.language": "Language",
    "settings.languageDescription": "Choose your preferred language.",
    "language.verificationRequired": "Verification is required before changing your language.",
  },
  es: {
    "common.loading": "Cargando...",
    "common.error": "Algo salió mal.",
    "common.cancel": "Cancelar",
    "common.save": "Guardar",
    "navigation.community": "Comunidad",
    "navigation.subscription": "Suscripción",
    "navigation.login": "Iniciar sesión",
    "navigation.logout": "Cerrar sesión",
    "settings.language": "Idioma",
    "settings.languageDescription": "Elige tu idioma preferido.",
    "language.verificationRequired": "Se requiere verificación antes de cambiar el idioma.",
  },
  hi: {
    "common.loading": "लोड हो रहा है...",
    "common.error": "कुछ गलत हो गया।",
    "common.cancel": "रद्द करें",
    "common.save": "सहेजें",
    "navigation.community": "समुदाय",
    "navigation.subscription": "सदस्यता",
    "navigation.login": "लॉग इन करें",
    "navigation.logout": "लॉग आउट करें",
    "settings.language": "भाषा",
    "settings.languageDescription": "अपनी पसंदीदा भाषा चुनें।",
    "language.verificationRequired": "भाषा बदलने से पहले सत्यापन आवश्यक है।",
  },
  pt: {
    "common.loading": "Carregando...",
    "common.error": "Algo deu errado.",
    "common.cancel": "Cancelar",
    "common.save": "Salvar",
    "navigation.community": "Comunidade",
    "navigation.subscription": "Assinatura",
    "navigation.login": "Entrar",
    "navigation.logout": "Sair",
    "settings.language": "Idioma",
    "settings.languageDescription": "Escolha seu idioma preferido.",
    "language.verificationRequired": "A verificacao e necessaria antes de alterar o idioma.",
  },
  zh: {
    "common.loading": "加载中...",
    "common.error": "出了点问题。",
    "common.cancel": "取消",
    "common.save": "保存",
    "navigation.community": "社区",
    "navigation.subscription": "订阅",
    "navigation.login": "登录",
    "navigation.logout": "退出登录",
    "settings.language": "语言",
    "settings.languageDescription": "选择你的首选语言。",
    "language.verificationRequired": "更改语言前需要完成验证。",
  },
  fr: {
    "common.loading": "Chargement...",
    "common.error": "Une erreur s'est produite.",
    "common.cancel": "Annuler",
    "common.save": "Enregistrer",
    "navigation.community": "Communaute",
    "navigation.subscription": "Abonnement",
    "navigation.login": "Se connecter",
    "navigation.logout": "Se deconnecter",
    "settings.language": "Langue",
    "settings.languageDescription": "Choisissez votre langue preferee.",
    "language.verificationRequired": "Une verification est requise avant de changer la langue.",
  },
};

const additionalTranslations: Record<Locale, Record<string, string>> = {
  en: {
    "navigation.toggleSidebar": "Toggle sidebar", "navigation.about": "About", "navigation.products": "Products", "navigation.forteams": "For Teams", "navigation.search": "Search...", "navigation.home": "Home", "navigation.questions": "Questions", "navigation.aiAssist": "AI Assist", "navigation.labs": "Labs", "navigation.tags": "Tags", "navigation.users": "Users", "navigation.saves": "Saves", "navigation.challenges": "Challenges", "navigation.chat": "Chat", "navigation.articles": "Articles", "navigation.companies": "Companies",
    "common.new": "NEW", "common.or": "or", "common.processing": "Processing...",
    "sidebar.overflowBlog": "The Overflow Blog", "sidebar.newEra": "A new era of Stack Overflow", "sidebar.movieLanguageLearning": "How your favorite movie is changing language learning technology", "sidebar.featuredMeta": "Featured on Meta", "sidebar.communityAsks": "Results of the June 2025 Community Asks Sprint", "sidebar.visualIdentity": "Will you help build our new visual identity?", "sidebar.aiPolicy": "Policy: Generative AI (e.g., ChatGPT) is banned", "sidebar.customFilters": "Custom Filters", "sidebar.createFilter": "Create a custom filter", "sidebar.watchedTags": "Watched Tags", "sidebar.watchTagsDescription": "Watch tags to curate your list of questions.", "sidebar.watchTag": "Watch a tag",
    "auth.fieldsRequired": "All fields are required", "auth.loginTitle": "Log in to your account", "auth.loginDescription": "Enter your email and password to access Stack Overflow", "auth.loginGoogle": "Log in with Google", "auth.loginGithub": "Log in with GitHub", "auth.orContinue": "Or continue with", "auth.email": "Email", "auth.password": "Password", "auth.forgotPassword": "Forgot your password?", "auth.noAccount": "Don't have an account?", "auth.signup": "Sign up", "auth.signupTitle": "Create your account", "auth.signupDescription": "Join the Stack Overflow community", "auth.signupGoogle": "Sign up with Google", "auth.signupGithub": "Sign up with GitHub", "auth.displayName": "Display name", "auth.displayNamePlaceholder": "Enter your display name", "auth.passwordRequirements": "Passwords must contain at least eight characters, including at least 1 letter and 1 number.", "auth.terms": "Terms of Service", "auth.privacy": "Privacy Policy", "auth.signingUp": "Signing up...", "auth.haveAccount": "Already have an account?", "auth.phone": "Phone number",
    "forgot.emailOrPhoneRequired": "Please enter your email or phone number", "forgot.invalidEmail": "Please enter a valid email address", "forgot.invalidPhone": "Please enter a valid phone number", "forgot.success": "Password reset link processed successfully", "forgot.title": "Forgot password", "forgot.description": "Enter your registered email address or phone number to reset your password.", "forgot.reset": "Reset password", "forgot.newPassword": "Your new password:", "forgot.backToLogin": "Back to login",
  },
  es: {
    "navigation.toggleSidebar": "Alternar barra lateral", "navigation.about": "Acerca de", "navigation.products": "Productos", "navigation.forteams": "Para equipos", "navigation.search": "Buscar...", "navigation.home": "Inicio", "navigation.questions": "Preguntas", "navigation.aiAssist": "Asistente de IA", "navigation.labs": "Laboratorio", "navigation.tags": "Etiquetas", "navigation.users": "Usuarios", "navigation.saves": "Guardados", "navigation.challenges": "Desafíos", "navigation.chat": "Chat", "navigation.articles": "Artículos", "navigation.companies": "Empresas", "common.new": "NUEVO", "common.or": "o", "common.processing": "Procesando...", "sidebar.overflowBlog": "El blog de Overflow", "sidebar.newEra": "Una nueva era de Stack Overflow", "sidebar.movieLanguageLearning": "Cómo tu película favorita está cambiando la tecnología para aprender idiomas", "sidebar.featuredMeta": "Destacado en Meta", "sidebar.communityAsks": "Resultados del Sprint de solicitudes de la comunidad de junio de 2025", "sidebar.visualIdentity": "¿Ayudarás a crear nuestra nueva identidad visual?", "sidebar.aiPolicy": "Política: la IA generativa está prohibida", "sidebar.customFilters": "Filtros personalizados", "sidebar.createFilter": "Crear un filtro personalizado", "sidebar.watchedTags": "Etiquetas observadas", "sidebar.watchTagsDescription": "Observa etiquetas para organizar tus preguntas.", "sidebar.watchTag": "Observar una etiqueta", "auth.fieldsRequired": "Todos los campos son obligatorios", "auth.loginTitle": "Inicia sesión en tu cuenta", "auth.loginDescription": "Introduce tu correo y contraseña para acceder a Stack Overflow", "auth.loginGoogle": "Iniciar sesión con Google", "auth.loginGithub": "Iniciar sesión con GitHub", "auth.orContinue": "O continúa con", "auth.email": "Correo electrónico", "auth.password": "Contraseña", "auth.forgotPassword": "¿Olvidaste tu contraseña?", "auth.noAccount": "¿No tienes una cuenta?", "auth.signup": "Registrarse", "auth.signupTitle": "Crea tu cuenta", "auth.signupDescription": "Únete a la comunidad de Stack Overflow", "auth.signupGoogle": "Registrarse con Google", "auth.signupGithub": "Registrarse con GitHub", "auth.displayName": "Nombre visible", "auth.displayNamePlaceholder": "Introduce tu nombre visible", "auth.passwordRequirements": "Las contraseñas deben tener al menos ocho caracteres, incluyendo una letra y un número.", "auth.terms": "Términos del servicio", "auth.privacy": "Política de privacidad", "auth.signingUp": "Registrando...", "auth.haveAccount": "¿Ya tienes una cuenta?", "auth.phone": "Número de teléfono", "forgot.emailOrPhoneRequired": "Introduce tu correo o número de teléfono", "forgot.invalidEmail": "Introduce un correo válido", "forgot.invalidPhone": "Introduce un número de teléfono válido", "forgot.success": "El enlace para restablecer la contraseña fue procesado", "forgot.title": "Contraseña olvidada", "forgot.description": "Introduce tu correo o número de teléfono registrado para restablecer tu contraseña.", "forgot.reset": "Restablecer contraseña", "forgot.newPassword": "Tu nueva contraseña:", "forgot.backToLogin": "Volver a iniciar sesión",
  },
  hi: {
    "navigation.toggleSidebar": "साइडबार बदलें", "navigation.about": "परिचय", "navigation.products": "उत्पाद", "navigation.forteams": "टीमों के लिए", "navigation.search": "खोजें...", "navigation.home": "होम", "navigation.questions": "प्रश्न", "navigation.aiAssist": "AI सहायता", "navigation.labs": "लैब्स", "navigation.tags": "टैग", "navigation.users": "उपयोगकर्ता", "navigation.saves": "सहेजे गए", "navigation.challenges": "चुनौतियां", "navigation.chat": "चैट", "navigation.articles": "लेख", "navigation.companies": "कंपनियां", "common.new": "नया", "common.or": "या", "common.processing": "प्रक्रिया जारी है...", "sidebar.overflowBlog": "द ओवरफ्लो ब्लॉग", "sidebar.newEra": "Stack Overflow का नया युग", "sidebar.movieLanguageLearning": "आपकी पसंदीदा फिल्म भाषा सीखने की तकनीक बदल रही है", "sidebar.featuredMeta": "Meta पर विशेष", "sidebar.communityAsks": "जून 2025 कम्युनिटी आस्क्स स्प्रिंट के परिणाम", "sidebar.visualIdentity": "क्या आप हमारी नई दृश्य पहचान बनाने में मदद करेंगे?", "sidebar.aiPolicy": "नीति: जनरेटिव AI प्रतिबंधित है", "sidebar.customFilters": "कस्टम फ़िल्टर", "sidebar.createFilter": "कस्टम फ़िल्टर बनाएं", "sidebar.watchedTags": "देखे गए टैग", "sidebar.watchTagsDescription": "अपने प्रश्नों की सूची बनाने के लिए टैग देखें।", "sidebar.watchTag": "टैग देखें", "auth.fieldsRequired": "सभी फ़ील्ड आवश्यक हैं", "auth.loginTitle": "अपने खाते में लॉग इन करें", "auth.loginDescription": "Stack Overflow पर जाने के लिए ईमेल और पासवर्ड दर्ज करें", "auth.loginGoogle": "Google से लॉग इन करें", "auth.loginGithub": "GitHub से लॉग इन करें", "auth.orContinue": "या जारी रखें", "auth.email": "ईमेल", "auth.password": "पासवर्ड", "auth.forgotPassword": "पासवर्ड भूल गए?", "auth.noAccount": "खाता नहीं है?", "auth.signup": "साइन अप", "auth.signupTitle": "अपना खाता बनाएं", "auth.signupDescription": "Stack Overflow समुदाय से जुड़ें", "auth.signupGoogle": "Google से साइन अप करें", "auth.signupGithub": "GitHub से साइन अप करें", "auth.displayName": "प्रदर्शित नाम", "auth.displayNamePlaceholder": "अपना प्रदर्शित नाम दर्ज करें", "auth.passwordRequirements": "पासवर्ड में कम से कम आठ अक्षर, एक अक्षर और एक संख्या होनी चाहिए।", "auth.terms": "सेवा की शर्तें", "auth.privacy": "गोपनीयता नीति", "auth.signingUp": "साइन अप हो रहा है...", "auth.haveAccount": "पहले से खाता है?", "auth.phone": "फ़ोन नंबर", "forgot.emailOrPhoneRequired": "ईमेल या फ़ोन नंबर दर्ज करें", "forgot.invalidEmail": "मान्य ईमेल दर्ज करें", "forgot.invalidPhone": "मान्य फ़ोन नंबर दर्ज करें", "forgot.success": "पासवर्ड रीसेट लिंक संसाधित हो गया", "forgot.title": "पासवर्ड भूल गए", "forgot.description": "पासवर्ड रीसेट करने के लिए पंजीकृत ईमेल या फ़ोन नंबर दर्ज करें।", "forgot.reset": "पासवर्ड रीसेट करें", "forgot.newPassword": "आपका नया पासवर्ड:", "forgot.backToLogin": "लॉगिन पर वापस जाएं",
  },
  pt: {
    "navigation.toggleSidebar": "Alternar barra lateral", "navigation.about": "Sobre", "navigation.products": "Produtos", "navigation.forteams": "Para equipes", "navigation.search": "Pesquisar...", "navigation.home": "Início", "navigation.questions": "Perguntas", "navigation.aiAssist": "Assistente de IA", "navigation.labs": "Laboratório", "navigation.tags": "Tags", "navigation.users": "Usuários", "navigation.saves": "Salvos", "navigation.challenges": "Desafios", "navigation.chat": "Chat", "navigation.articles": "Artigos", "navigation.companies": "Empresas", "common.new": "NOVO", "common.or": "ou", "common.processing": "Processando...", "sidebar.overflowBlog": "O blog do Overflow", "sidebar.newEra": "Uma nova era do Stack Overflow", "sidebar.movieLanguageLearning": "Como seu filme favorito está mudando a tecnologia de aprendizagem de idiomas", "sidebar.featuredMeta": "Destaque no Meta", "sidebar.communityAsks": "Resultados do Sprint de solicitações da comunidade de junho de 2025", "sidebar.visualIdentity": "Você ajudará a criar nossa nova identidade visual?", "sidebar.aiPolicy": "Política: IA generativa é proibida", "sidebar.customFilters": "Filtros personalizados", "sidebar.createFilter": "Criar filtro personalizado", "sidebar.watchedTags": "Tags observadas", "sidebar.watchTagsDescription": "Observe tags para organizar sua lista de perguntas.", "sidebar.watchTag": "Observar uma tag", "auth.fieldsRequired": "Todos os campos são obrigatórios", "auth.loginTitle": "Entre na sua conta", "auth.loginDescription": "Digite seu e-mail e senha para acessar o Stack Overflow", "auth.loginGoogle": "Entrar com Google", "auth.loginGithub": "Entrar com GitHub", "auth.orContinue": "Ou continue com", "auth.email": "E-mail", "auth.password": "Senha", "auth.forgotPassword": "Esqueceu sua senha?", "auth.noAccount": "Não tem uma conta?", "auth.signup": "Cadastrar", "auth.signupTitle": "Crie sua conta", "auth.signupDescription": "Junte-se à comunidade do Stack Overflow", "auth.signupGoogle": "Cadastrar com Google", "auth.signupGithub": "Cadastrar com GitHub", "auth.displayName": "Nome de exibição", "auth.displayNamePlaceholder": "Digite seu nome de exibição", "auth.passwordRequirements": "As senhas devem conter pelo menos oito caracteres, incluindo uma letra e um número.", "auth.terms": "Termos de serviço", "auth.privacy": "Política de privacidade", "auth.signingUp": "Cadastrando...", "auth.haveAccount": "Já tem uma conta?", "auth.phone": "Número de telefone", "forgot.emailOrPhoneRequired": "Digite seu e-mail ou número de telefone", "forgot.invalidEmail": "Digite um e-mail válido", "forgot.invalidPhone": "Digite um número de telefone válido", "forgot.success": "O link de redefinição de senha foi processado", "forgot.title": "Esqueci a senha", "forgot.description": "Digite seu e-mail ou telefone cadastrado para redefinir sua senha.", "forgot.reset": "Redefinir senha", "forgot.newPassword": "Sua nova senha:", "forgot.backToLogin": "Voltar ao login",
  },
  zh: {
    "navigation.toggleSidebar": "切换侧边栏", "navigation.about": "关于", "navigation.products": "产品", "navigation.forteams": "团队版", "navigation.search": "搜索...", "navigation.home": "首页", "navigation.questions": "问题", "navigation.aiAssist": "AI 助手", "navigation.labs": "实验室", "navigation.tags": "标签", "navigation.users": "用户", "navigation.saves": "已保存", "navigation.challenges": "挑战", "navigation.chat": "聊天", "navigation.articles": "文章", "navigation.companies": "公司", "common.new": "新", "common.or": "或", "common.processing": "处理中...", "sidebar.overflowBlog": "Overflow 博客", "sidebar.newEra": "Stack Overflow 的新时代", "sidebar.movieLanguageLearning": "你最喜欢的电影如何改变语言学习技术", "sidebar.featuredMeta": "Meta 精选", "sidebar.communityAsks": "2025 年 6 月社区请求冲刺结果", "sidebar.visualIdentity": "你愿意帮助打造我们的新视觉形象吗？", "sidebar.aiPolicy": "政策：禁止使用生成式 AI", "sidebar.customFilters": "自定义筛选", "sidebar.createFilter": "创建自定义筛选", "sidebar.watchedTags": "关注的标签", "sidebar.watchTagsDescription": "关注标签来整理你的问题列表。", "sidebar.watchTag": "关注标签", "auth.fieldsRequired": "所有字段均为必填项", "auth.loginTitle": "登录你的账户", "auth.loginDescription": "输入邮箱和密码以访问 Stack Overflow", "auth.loginGoogle": "使用 Google 登录", "auth.loginGithub": "使用 GitHub 登录", "auth.orContinue": "或继续使用", "auth.email": "邮箱", "auth.password": "密码", "auth.forgotPassword": "忘记密码？", "auth.noAccount": "还没有账户？", "auth.signup": "注册", "auth.signupTitle": "创建账户", "auth.signupDescription": "加入 Stack Overflow 社区", "auth.signupGoogle": "使用 Google 注册", "auth.signupGithub": "使用 GitHub 注册", "auth.displayName": "显示名称", "auth.displayNamePlaceholder": "输入显示名称", "auth.passwordRequirements": "密码至少需要八个字符，并包含至少一个字母和一个数字。", "auth.terms": "服务条款", "auth.privacy": "隐私政策", "auth.signingUp": "注册中...", "auth.haveAccount": "已经有账户？", "auth.phone": "电话号码", "forgot.emailOrPhoneRequired": "请输入邮箱或电话号码", "forgot.invalidEmail": "请输入有效的邮箱地址", "forgot.invalidPhone": "请输入有效的电话号码", "forgot.success": "密码重置链接已处理", "forgot.title": "忘记密码", "forgot.description": "输入注册邮箱或电话号码以重置密码。", "forgot.reset": "重置密码", "forgot.newPassword": "你的新密码：", "forgot.backToLogin": "返回登录",
  },
  fr: {
    "navigation.toggleSidebar": "Afficher la barre latérale", "navigation.about": "À propos", "navigation.products": "Produits", "navigation.forteams": "Pour les équipes", "navigation.search": "Rechercher...", "navigation.home": "Accueil", "navigation.questions": "Questions", "navigation.aiAssist": "Assistant IA", "navigation.labs": "Laboratoire", "navigation.tags": "Tags", "navigation.users": "Utilisateurs", "navigation.saves": "Enregistrés", "navigation.challenges": "Défis", "navigation.chat": "Discussion", "navigation.articles": "Articles", "navigation.companies": "Entreprises", "common.new": "NOUVEAU", "common.or": "ou", "common.processing": "Traitement...", "sidebar.overflowBlog": "Le blog Overflow", "sidebar.newEra": "Une nouvelle ère de Stack Overflow", "sidebar.movieLanguageLearning": "Comment votre film préféré change la technologie d'apprentissage des langues", "sidebar.featuredMeta": "À la une sur Meta", "sidebar.communityAsks": "Résultats du sprint des demandes de la communauté de juin 2025", "sidebar.visualIdentity": "Voulez-vous aider à créer notre nouvelle identité visuelle ?", "sidebar.aiPolicy": "Politique : l'IA générative est interdite", "sidebar.customFilters": "Filtres personnalisés", "sidebar.createFilter": "Créer un filtre personnalisé", "sidebar.watchedTags": "Tags suivis", "sidebar.watchTagsDescription": "Suivez des tags pour organiser votre liste de questions.", "sidebar.watchTag": "Suivre un tag", "auth.fieldsRequired": "Tous les champs sont obligatoires", "auth.loginTitle": "Connectez-vous à votre compte", "auth.loginDescription": "Saisissez votre e-mail et votre mot de passe pour accéder à Stack Overflow", "auth.loginGoogle": "Se connecter avec Google", "auth.loginGithub": "Se connecter avec GitHub", "auth.orContinue": "Ou continuer avec", "auth.email": "E-mail", "auth.password": "Mot de passe", "auth.forgotPassword": "Mot de passe oublié ?", "auth.noAccount": "Vous n'avez pas de compte ?", "auth.signup": "S'inscrire", "auth.signupTitle": "Créez votre compte", "auth.signupDescription": "Rejoignez la communauté Stack Overflow", "auth.signupGoogle": "S'inscrire avec Google", "auth.signupGithub": "S'inscrire avec GitHub", "auth.displayName": "Nom affiché", "auth.displayNamePlaceholder": "Saisissez votre nom affiché", "auth.passwordRequirements": "Les mots de passe doivent contenir au moins huit caractères, dont une lettre et un chiffre.", "auth.terms": "Conditions d'utilisation", "auth.privacy": "Politique de confidentialité", "auth.signingUp": "Inscription...", "auth.haveAccount": "Vous avez déjà un compte ?", "auth.phone": "Numéro de téléphone", "forgot.emailOrPhoneRequired": "Saisissez votre e-mail ou votre numéro de téléphone", "forgot.invalidEmail": "Saisissez une adresse e-mail valide", "forgot.invalidPhone": "Saisissez un numéro de téléphone valide", "forgot.success": "Le lien de réinitialisation du mot de passe a été traité", "forgot.title": "Mot de passe oublié", "forgot.description": "Saisissez votre e-mail ou numéro de téléphone enregistré pour réinitialiser votre mot de passe.", "forgot.reset": "Réinitialiser le mot de passe", "forgot.newPassword": "Votre nouveau mot de passe :", "forgot.backToLogin": "Retour à la connexion",
  },
};

Object.entries(additionalTranslations).forEach(([locale, values]) => {
  Object.assign(translations[locale as Locale], values);
});

const pageTranslations: Record<Locale, Record<string, string>> = {
  en: {
    "questions.none": "No question found.", "questions.top": "Top Questions", "questions.ask": "Ask Question", "questions.questions": "questions", "questions.newest": "Newest", "questions.active": "Active", "questions.bountied": "Bountied", "questions.unanswered": "Unanswered", "common.more": "More", "common.filter": "Filter", "questions.votes": "votes", "questions.asked": "Asked", "questions.loginToAsk": "Please log in to ask a question", "questions.posted": "Question posted successfully", "questions.askPublic": "Ask a public question", "questions.writingGood": "Writing a good question", "questions.title": "Title", "questions.titleHint": "Be specific and imagine you're asking a question to another person.", "questions.details": "What are the details of your problem?", "questions.detailsHint": "Introduce the problem and expand on what you put in the title. Minimum 20 characters.", "questions.tags": "Tags", "questions.tagsHint": "Add up to 5 tags to describe what your question is about.", "questions.review": "Review your question", "users.none": "No users found.", "users.title": "Users", "users.filter": "Filter by user", "users.joined": "Joined", "subscription.upgrade": "Upgrade Your Plan", "subscription.description": "Choose a plan that fits your needs and unlock premium features.", "subscription.current": "Current", "subscription.month": "/month", "subscription.unlimitedQuestions": "Unlimited questions", "subscription.questionsDay": "questions/day", "subscription.advancedSearch": "Advanced search", "subscription.badge": "badge", "subscription.prioritySupport": "Priority support", "subscription.enhancedVisibility": "Enhanced visibility", "subscription.unlimitedBookmarks": "Unlimited bookmarks", "subscription.exclusiveCommunity": "Exclusive community", "subscription.openingCheckout": "Opening checkout...", "subscription.currentPlan": "Current Plan", "subscription.plan": "Plan", "billing.cancelConfirm": "Are you sure? You will retain access until the billing period ends.", "billing.cancelled": "Subscription cancelled", "billing.cancelFailed": "Failed to cancel subscription", "billing.invoiceFailed": "Unable to download invoice", "billing.title": "Billing & Subscription", "billing.currentSubscription": "Current Subscription", "billing.currentDescription": "Your active plan and subscription details", "billing.status": "Status", "billing.startDate": "Start Date", "billing.renewalDate": "Renewal Date", "billing.cancelAtPeriodEnd": "This subscription will be cancelled at the end of the billing period.", "billing.info": "Billing Info", "billing.email": "Billing Email", "billing.memberSince": "Member Since", "billing.paymentHistory": "Payment History", "billing.paymentDescription": "Your recent transactions and invoices", "billing.date": "Date", "billing.amount": "Amount", "billing.invoice": "Invoice", "common.notAvailable": "N/A",
  },
  es: {
    "questions.none": "No se encontraron preguntas.", "questions.top": "Preguntas destacadas", "questions.ask": "Hacer una pregunta", "questions.questions": "preguntas", "questions.newest": "Más nuevas", "questions.active": "Activas", "questions.bountied": "Con recompensa", "questions.unanswered": "Sin respuesta", "common.more": "Más", "common.filter": "Filtrar", "questions.votes": "votos", "questions.asked": "Preguntada", "questions.loginToAsk": "Inicia sesión para hacer una pregunta", "questions.posted": "Pregunta publicada correctamente", "questions.askPublic": "Hacer una pregunta pública", "questions.writingGood": "Escribir una buena pregunta", "questions.title": "Título", "questions.titleHint": "Sé específico e imagina que preguntas a otra persona.", "questions.details": "¿Cuáles son los detalles de tu problema?", "questions.detailsHint": "Presenta el problema y amplía lo indicado en el título. Mínimo 20 caracteres.", "questions.tags": "Etiquetas", "questions.tagsHint": "Añade hasta 5 etiquetas para describir tu pregunta.", "questions.review": "Revisar pregunta", "users.none": "No se encontraron usuarios.", "users.title": "Usuarios", "users.filter": "Filtrar por usuario", "users.joined": "Se unió", "subscription.upgrade": "Mejora tu plan", "subscription.description": "Elige un plan adecuado para ti y desbloquea funciones premium.", "subscription.current": "Actual", "subscription.month": "/mes", "subscription.unlimitedQuestions": "Preguntas ilimitadas", "subscription.questionsDay": "preguntas/día", "subscription.advancedSearch": "Búsqueda avanzada", "subscription.badge": "insignia", "subscription.prioritySupport": "Soporte prioritario", "subscription.enhancedVisibility": "Mayor visibilidad", "subscription.unlimitedBookmarks": "Marcadores ilimitados", "subscription.exclusiveCommunity": "Comunidad exclusiva", "subscription.openingCheckout": "Abriendo pago...", "subscription.currentPlan": "Plan actual", "subscription.plan": "Plan", "billing.cancelConfirm": "¿Seguro? Mantendrás el acceso hasta que termine el periodo de facturación.", "billing.cancelled": "Suscripción cancelada", "billing.cancelFailed": "No se pudo cancelar la suscripción", "billing.invoiceFailed": "No se pudo descargar la factura", "billing.title": "Facturación y suscripción", "billing.currentSubscription": "Suscripción actual", "billing.currentDescription": "Detalles de tu plan y suscripción activa", "billing.status": "Estado", "billing.startDate": "Fecha de inicio", "billing.renewalDate": "Fecha de renovación", "billing.cancelAtPeriodEnd": "La suscripción se cancelará al final del periodo de facturación.", "billing.info": "Información de facturación", "billing.email": "Correo de facturación", "billing.memberSince": "Miembro desde", "billing.paymentHistory": "Historial de pagos", "billing.paymentDescription": "Tus transacciones y facturas recientes", "billing.date": "Fecha", "billing.amount": "Importe", "billing.invoice": "Factura", "common.notAvailable": "No disponible",
  },
  hi: {
    "questions.none": "कोई प्रश्न नहीं मिला।", "questions.top": "शीर्ष प्रश्न", "questions.ask": "प्रश्न पूछें", "questions.questions": "प्रश्न", "questions.newest": "नवीनतम", "questions.active": "सक्रिय", "questions.bountied": "इनाम वाले", "questions.unanswered": "अनुत्तरित", "common.more": "अधिक", "common.filter": "फ़िल्टर", "questions.votes": "वोट", "questions.asked": "पूछा गया", "questions.loginToAsk": "प्रश्न पूछने के लिए लॉग इन करें", "questions.posted": "प्रश्न सफलतापूर्वक पोस्ट हुआ", "questions.askPublic": "सार्वजनिक प्रश्न पूछें", "questions.writingGood": "अच्छा प्रश्न लिखना", "questions.title": "शीर्षक", "questions.titleHint": "विशिष्ट रहें और कल्पना करें कि आप किसी अन्य व्यक्ति से प्रश्न पूछ रहे हैं।", "questions.details": "आपकी समस्या का विवरण क्या है?", "questions.detailsHint": "समस्या बताएं और शीर्षक में लिखी बात को विस्तार दें। कम से कम 20 अक्षर।", "questions.tags": "टैग", "questions.tagsHint": "अपने प्रश्न का वर्णन करने के लिए अधिकतम 5 टैग जोड़ें।", "questions.review": "प्रश्न की समीक्षा करें", "users.none": "कोई उपयोगकर्ता नहीं मिला।", "users.title": "उपयोगकर्ता", "users.filter": "उपयोगकर्ता फ़िल्टर करें", "users.joined": "शामिल हुए", "subscription.upgrade": "अपना प्लान अपग्रेड करें", "subscription.description": "अपनी जरूरत के अनुसार प्लान चुनें और प्रीमियम सुविधाएं पाएं।", "subscription.current": "वर्तमान", "subscription.month": "/माह", "subscription.unlimitedQuestions": "असीमित प्रश्न", "subscription.questionsDay": "प्रश्न/दिन", "subscription.advancedSearch": "उन्नत खोज", "subscription.badge": "बैज", "subscription.prioritySupport": "प्राथमिक सहायता", "subscription.enhancedVisibility": "बेहतर दृश्यता", "subscription.unlimitedBookmarks": "असीमित बुकमार्क", "subscription.exclusiveCommunity": "विशेष समुदाय", "subscription.openingCheckout": "चेकआउट खुल रहा है...", "subscription.currentPlan": "वर्तमान प्लान", "subscription.plan": "प्लान", "billing.cancelConfirm": "क्या आप निश्चित हैं? बिलिंग अवधि समाप्त होने तक आपकी पहुंच रहेगी।", "billing.cancelled": "सदस्यता रद्द हुई", "billing.cancelFailed": "सदस्यता रद्द नहीं हो सकी", "billing.invoiceFailed": "इनवॉइस डाउनलोड नहीं हो सका", "billing.title": "बिलिंग और सदस्यता", "billing.currentSubscription": "वर्तमान सदस्यता", "billing.currentDescription": "आपके सक्रिय प्लान और सदस्यता का विवरण", "billing.status": "स्थिति", "billing.startDate": "आरंभ तिथि", "billing.renewalDate": "नवीनीकरण तिथि", "billing.cancelAtPeriodEnd": "बिलिंग अवधि के अंत में सदस्यता रद्द हो जाएगी।", "billing.info": "बिलिंग जानकारी", "billing.email": "बिलिंग ईमेल", "billing.memberSince": "सदस्य बने", "billing.paymentHistory": "भुगतान इतिहास", "billing.paymentDescription": "आपके हाल के लेनदेन और इनवॉइस", "billing.date": "तिथि", "billing.amount": "राशि", "billing.invoice": "इनवॉइस", "common.notAvailable": "उपलब्ध नहीं",
  },
  pt: {
    "questions.none": "Nenhuma pergunta encontrada.", "questions.top": "Principais perguntas", "questions.ask": "Fazer pergunta", "questions.questions": "perguntas", "questions.newest": "Mais recentes", "questions.active": "Ativas", "questions.bountied": "Com recompensa", "questions.unanswered": "Sem resposta", "common.more": "Mais", "common.filter": "Filtrar", "questions.votes": "votos", "questions.asked": "Perguntada", "questions.loginToAsk": "Entre para fazer uma pergunta", "questions.posted": "Pergunta publicada com sucesso", "questions.askPublic": "Fazer uma pergunta pública", "questions.writingGood": "Escrevendo uma boa pergunta", "questions.title": "Título", "questions.titleHint": "Seja específico e imagine que está perguntando a outra pessoa.", "questions.details": "Quais são os detalhes do seu problema?", "questions.detailsHint": "Apresente o problema e amplie o que escreveu no título. Mínimo de 20 caracteres.", "questions.tags": "Tags", "questions.tagsHint": "Adicione até 5 tags para descrever sua pergunta.", "questions.review": "Revisar pergunta", "users.none": "Nenhum usuário encontrado.", "users.title": "Usuários", "users.filter": "Filtrar por usuário", "users.joined": "Entrou em", "subscription.upgrade": "Atualize seu plano", "subscription.description": "Escolha um plano adequado às suas necessidades e desbloqueie recursos premium.", "subscription.current": "Atual", "subscription.month": "/mês", "subscription.unlimitedQuestions": "Perguntas ilimitadas", "subscription.questionsDay": "perguntas/dia", "subscription.advancedSearch": "Pesquisa avançada", "subscription.badge": "badge", "subscription.prioritySupport": "Suporte prioritário", "subscription.enhancedVisibility": "Visibilidade aprimorada", "subscription.unlimitedBookmarks": "Favoritos ilimitados", "subscription.exclusiveCommunity": "Comunidade exclusiva", "subscription.openingCheckout": "Abrindo checkout...", "subscription.currentPlan": "Plano atual", "subscription.plan": "Plano", "billing.cancelConfirm": "Tem certeza? Você manterá o acesso até o fim do período de cobrança.", "billing.cancelled": "Assinatura cancelada", "billing.cancelFailed": "Falha ao cancelar a assinatura", "billing.invoiceFailed": "Não foi possível baixar a fatura", "billing.title": "Cobrança e assinatura", "billing.currentSubscription": "Assinatura atual", "billing.currentDescription": "Detalhes do seu plano e assinatura ativa", "billing.status": "Status", "billing.startDate": "Data de início", "billing.renewalDate": "Data de renovação", "billing.cancelAtPeriodEnd": "A assinatura será cancelada no fim do período de cobrança.", "billing.info": "Informações de cobrança", "billing.email": "E-mail de cobrança", "billing.memberSince": "Membro desde", "billing.paymentHistory": "Histórico de pagamentos", "billing.paymentDescription": "Suas transações e faturas recentes", "billing.date": "Data", "billing.amount": "Valor", "billing.invoice": "Fatura", "common.notAvailable": "Indisponível",
  },
  zh: {
    "questions.none": "未找到问题。", "questions.top": "热门问题", "questions.ask": "提问", "questions.questions": "个问题", "questions.newest": "最新", "questions.active": "活跃", "questions.bountied": "悬赏", "questions.unanswered": "未回答", "common.more": "更多", "common.filter": "筛选", "questions.votes": "票数", "questions.asked": "提问于", "questions.loginToAsk": "请登录后提问", "questions.posted": "问题发布成功", "questions.askPublic": "提出公开问题", "questions.writingGood": "写出好问题", "questions.title": "标题", "questions.titleHint": "请具体描述，并设想你正在向他人提问。", "questions.details": "问题的详细信息是什么？", "questions.detailsHint": "介绍问题并扩展标题中的内容。至少 20 个字符。", "questions.tags": "标签", "questions.tagsHint": "添加最多 5 个标签来描述你的问题。", "questions.review": "检查问题", "users.none": "未找到用户。", "users.title": "用户", "users.filter": "按用户筛选", "users.joined": "加入于", "subscription.upgrade": "升级你的套餐", "subscription.description": "选择适合你的套餐并解锁高级功能。", "subscription.current": "当前", "subscription.month": "/月", "subscription.unlimitedQuestions": "无限问题", "subscription.questionsDay": "问题/天", "subscription.advancedSearch": "高级搜索", "subscription.badge": "徽章", "subscription.prioritySupport": "优先支持", "subscription.enhancedVisibility": "增强可见性", "subscription.unlimitedBookmarks": "无限收藏", "subscription.exclusiveCommunity": "专属社区", "subscription.openingCheckout": "正在打开结账...", "subscription.currentPlan": "当前套餐", "subscription.plan": "套餐", "billing.cancelConfirm": "确定吗？在计费周期结束前你仍可使用服务。", "billing.cancelled": "订阅已取消", "billing.cancelFailed": "取消订阅失败", "billing.invoiceFailed": "无法下载发票", "billing.title": "账单和订阅", "billing.currentSubscription": "当前订阅", "billing.currentDescription": "你的当前套餐和订阅详情", "billing.status": "状态", "billing.startDate": "开始日期", "billing.renewalDate": "续订日期", "billing.cancelAtPeriodEnd": "订阅将在计费周期结束时取消。", "billing.info": "账单信息", "billing.email": "账单邮箱", "billing.memberSince": "加入时间", "billing.paymentHistory": "付款记录", "billing.paymentDescription": "你最近的交易和发票", "billing.date": "日期", "billing.amount": "金额", "billing.invoice": "发票", "common.notAvailable": "不可用",
  },
  fr: {
    "questions.none": "Aucune question trouvée.", "questions.top": "Questions populaires", "questions.ask": "Poser une question", "questions.questions": "questions", "questions.newest": "Récentes", "questions.active": "Actives", "questions.bountied": "Avec prime", "questions.unanswered": "Sans réponse", "common.more": "Plus", "common.filter": "Filtrer", "questions.votes": "votes", "questions.asked": "Posée", "questions.loginToAsk": "Connectez-vous pour poser une question", "questions.posted": "Question publiée avec succès", "questions.askPublic": "Poser une question publique", "questions.writingGood": "Rédiger une bonne question", "questions.title": "Titre", "questions.titleHint": "Soyez précis et imaginez que vous posez une question à quelqu'un.", "questions.details": "Quels sont les détails de votre problème ?", "questions.detailsHint": "Présentez le problème et développez le titre. Minimum 20 caractères.", "questions.tags": "Tags", "questions.tagsHint": "Ajoutez jusqu'à 5 tags pour décrire votre question.", "questions.review": "Vérifier la question", "users.none": "Aucun utilisateur trouvé.", "users.title": "Utilisateurs", "users.filter": "Filtrer par utilisateur", "users.joined": "Inscrit en", "subscription.upgrade": "Améliorer votre forfait", "subscription.description": "Choisissez un forfait adapté à vos besoins et débloquez des fonctionnalités premium.", "subscription.current": "Actuel", "subscription.month": "/mois", "subscription.unlimitedQuestions": "Questions illimitées", "subscription.questionsDay": "questions/jour", "subscription.advancedSearch": "Recherche avancée", "subscription.badge": "badge", "subscription.prioritySupport": "Assistance prioritaire", "subscription.enhancedVisibility": "Visibilité améliorée", "subscription.unlimitedBookmarks": "Favoris illimités", "subscription.exclusiveCommunity": "Communauté exclusive", "subscription.openingCheckout": "Ouverture du paiement...", "subscription.currentPlan": "Forfait actuel", "subscription.plan": "Forfait", "billing.cancelConfirm": "Êtes-vous sûr ? Vous conserverez l'accès jusqu'à la fin de la période de facturation.", "billing.cancelled": "Abonnement annulé", "billing.cancelFailed": "Échec de l'annulation de l'abonnement", "billing.invoiceFailed": "Impossible de télécharger la facture", "billing.title": "Facturation et abonnement", "billing.currentSubscription": "Abonnement actuel", "billing.currentDescription": "Détails de votre forfait et abonnement actif", "billing.status": "Statut", "billing.startDate": "Date de début", "billing.renewalDate": "Date de renouvellement", "billing.cancelAtPeriodEnd": "Cet abonnement sera annulé à la fin de la période de facturation.", "billing.info": "Informations de facturation", "billing.email": "E-mail de facturation", "billing.memberSince": "Membre depuis", "billing.paymentHistory": "Historique des paiements", "billing.paymentDescription": "Vos transactions et factures récentes", "billing.date": "Date", "billing.amount": "Montant", "billing.invoice": "Facture", "common.notAvailable": "N/D",
  },
};

Object.entries(pageTranslations).forEach(([locale, values]) => {
  Object.assign(translations[locale as Locale], values);
});

const communityTranslations = {
  "community.loadFailed": "Unable to load the community feed.",
  "community.loginToInteract": "Log in to interact with the community.",
  "community.postContentRequired": "Add text, code, or an image URL before posting.",
  "community.postPublished": "Post published.",
  "community.publishFailed": "Unable to publish post.",
  "community.likeFailed": "Unable to update like.",
  "community.saved": "Saved to bookmarks.",
  "community.removedFromBookmarks": "Removed from bookmarks.",
  "community.bookmarkFailed": "Unable to update bookmark.",
  "community.commentsFailed": "Unable to load comments.",
  "community.commentFailed": "Unable to add comment.",
  "community.reportSubmitted": "Report submitted for moderator review.",
  "community.reportFailed": "Unable to submit report.",
  "community.shared": "Post shared and link copied.",
  "community.shareFailed": "Unable to share post.",
  "community.notificationsFailed": "Unable to load notifications.",
  "community.title": "Build in public.",
  "community.description": "Share progress, discoveries, and the work behind your next project.",
  "community.openNotifications": "Open notifications",
  "community.notifications": "Notifications",
  "community.markAllRead": "Mark all read",
  "community.nothingNew": "Nothing new.",
  "community.sharePrompt": "Share something you are learning or building...",
  "community.createPost": "Create a community post",
  "community.contentPlaceholder": "What are you working on? Add #hashtags and @mentions.",
  "community.characters": "characters",
  "community.publishing": "Publishing...",
  "community.publish": "Publish post",
  "community.feedModes": "Feed modes",
  "community.recent": "Recent",
  "community.trending": "Trending",
  "community.following": "Following",
  "community.noPosts": "No posts here yet",
  "community.firstPost": "Be the first person to share an update.",
  "community.loadingMore": "Loading more posts...",
  "community.endOfFeed": "You have reached the end of the feed.",
  "common.close": "Close",
  "common.retry": "Retry",
  "profile.updated": "Profile updated successfully!",
  "profile.edit": "Edit Profile",
  "profile.basicInformation": "Basic Information",
  "profile.about": "About",
  "profile.aboutMe": "About Me",
  "profile.aboutPlaceholder": "Tell us about yourself, your experience, and interests...",
  "profile.skills": "Skills & Technologies",
  "profile.skillPlaceholder": "Add a skill or technology",
  "profile.save": "Save Changes",
  "profile.memberSince": "Member since",
  "profile.goldBadges": "gold badges",
  "profile.silverBadges": "silver badges",
  "profile.bronzeBadges": "bronze badges",
  "auth.loginRequired": "Please log in to continue",
  "question.voteUpdated": "Vote updated",
  "question.voteFailed": "Failed to vote on the question",
  "question.answerUploaded": "Answer uploaded",
  "question.answerFailed": "Failed to submit answer",
  "question.deleteConfirm": "Are you sure you want to delete this question?",
  "question.deleteAnswerConfirm": "Are you sure you want to delete this answer?",
  "question.deleteFailed": "Failed to delete question",
  "common.deleted": "Deleted successfully",
  "question.share": "Share",
  "question.flag": "Flag",
  "common.delete": "Delete",
  "question.answers": "Answers",
  "question.yourAnswer": "Your Answer",
  "question.answerPlaceholder": "Write your answer here... You can use Markdown formatting.",
  "question.posting": "Posting...",
  "question.postAnswer": "Post Your Answer",
};

Object.assign(translations.en, communityTranslations);
supportedLocales.filter((locale) => locale !== "en").forEach((locale) => {
  Object.assign(translations[locale], communityTranslations);
});
