import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { getPublicProfile } from "../../account/accountApi";
import { t, getStoredLang, setStoredLang } from "../../../lib/i18n";
import SegmentedControl from "../../../components/SegmentedControl";
import { IconLock, IconKey } from "../../../components/icons";

const container = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const item = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
};

export default function Welcome() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(getStoredLang());
  const [profile, setProfile] = useState(null);

  useEffect(() => {
    getPublicProfile().then(setProfile);
  }, []);

  function handleLangChange(next) {
    setLang(next);
    setStoredLang(next);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="w-full max-w-sm text-center"
      >
        <motion.div variants={item} className="flex justify-center mb-6">
          <SegmentedControl
            name="welcome-lang"
            value={lang}
            onChange={handleLangChange}
            options={[
              { value: "de", label: "Deutsch" },
              { value: "en", label: "English" },
            ]}
          />
        </motion.div>

        <motion.div
          variants={item}
          className="w-16 h-16 rounded-full bg-card border border-mist flex items-center justify-center overflow-hidden mx-auto mb-5"
        >
          {profile?.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="font-display text-pine text-lg">L</span>
          )}
        </motion.div>

        <motion.h1 variants={item} className="font-display text-2xl mb-1">
          {t("welcomeTitle", lang)(profile?.display_name)}
        </motion.h1>
        <motion.p variants={item} className="text-sm text-ink/60 mb-8">
          {t("welcomeSubtitle", lang)}
        </motion.p>

        <motion.button
          variants={item}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/login")}
          className="w-full flex items-center gap-3 text-left bg-card border border-mist rounded-xl p-4 mb-3 hover:border-pine/40 transition-colors"
        >
          <span className="w-10 h-10 rounded-full bg-pine-soft flex items-center justify-center text-pine-deep flex-shrink-0">
            <IconLock />
          </span>
          <span>
            <p className="text-sm font-medium">{t("imOwner", lang)}</p>
            <p className="text-xs text-ink/50">{t("imOwnerSubtitle", lang)}</p>
          </span>
        </motion.button>

        <motion.button
          variants={item}
          whileTap={{ scale: 0.98 }}
          onClick={() => navigate("/access")}
          className="w-full flex items-center gap-3 text-left bg-card border border-mist rounded-xl p-4 hover:border-pine/40 transition-colors"
        >
          <span className="w-10 h-10 rounded-full bg-amber-soft flex items-center justify-center text-amber flex-shrink-0">
            <IconKey />
          </span>
          <span>
            <p className="text-sm font-medium">{t("haveCode", lang)}</p>
            <p className="text-xs text-ink/50">{t("haveCodeSubtitle", lang)}</p>
          </span>
        </motion.button>
      </motion.div>
    </div>
  );
}
