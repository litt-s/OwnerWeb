import { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  contact as staticContact,
  experience as staticExperience,
  hero as staticHero,
  profile as staticProfile,
  projects as staticProjects,
  repoPlatforms,
  strengths as staticStrengths,
} from '../data/resume';
import { fetchPublicProjects } from '../services/projects';
import { fetchPublicStrengths } from '../services/strengths';
import { fetchPublicSiteContent } from '../services/siteContent';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);

const fallbackSiteContent = {
  profile: staticProfile,
  hero: staticHero,
  experience: staticExperience,
  contact: staticContact,
};

function normalizeRepos(profile) {
  if (Array.isArray(profile.repos)) {
    return profile.repos
      .filter((item) => item && repoPlatforms.some((p) => p.key === item.key))
      .map((item) => ({
        key: item.key,
        username: item.username || '',
        url: item.url || '',
      }));
  }
  // 兼容旧数据：只有 github / githubUrl 时自动生成 GitHub 项
  if (profile.github || profile.githubUrl) {
    return [{ key: 'github', username: profile.github || '', url: profile.githubUrl || '' }];
  }
  return [];
}

function normalizeSiteContent(content) {
  const source = content && typeof content === 'object' ? content : {};
  const profile = { ...staticProfile, ...(source.profile || {}) };
  const contactSource = source.contact || {};
  return {
    profile: { ...profile, repos: normalizeRepos(profile) },
    hero: { ...staticHero, ...(source.hero || {}) },
    contact: {
      title: contactSource.title?.trim() ? contactSource.title : staticContact.title,
      eyebrow: contactSource.eyebrow?.trim() ? contactSource.eyebrow : staticContact.eyebrow,
    },
    experience: {
      ...staticExperience,
      ...(source.experience || {}),
      stats: Array.isArray(source.experience?.stats)
        ? source.experience.stats
        : staticExperience.stats,
    },
  };
}

function normalizeStrengths(list) {
  if (!Array.isArray(list)) return staticStrengths;
  return list.map((item, index) => ({
    ...item,
    id: item.id ?? item.n ?? index + 1,
    desc: item.desc || '',
  }));
}

export function ContentProvider({ children }) {
  const location = useLocation();
  const { token } = useAuth();
  const [projects, setProjects] = useState(staticProjects);
  const [projectsLoading, setProjectsLoading] = useState(true);
  const [strengths, setStrengths] = useState(
    staticStrengths.map((item, index) => ({ ...item, id: item.n || index + 1 }))
  );
  const [strengthsLoading, setStrengthsLoading] = useState(true);
  const [siteContent, setSiteContent] = useState(fallbackSiteContent);
  const [siteContentLoading, setSiteContentLoading] = useState(true);

  const loadProjects = async () => {
    try {
      setProjects(await fetchPublicProjects(token));
    } catch {
      // Keep the static fallback when the API is unavailable.
    } finally {
      setProjectsLoading(false);
    }
  };

  const loadStrengths = async () => {
    try {
      setStrengths(normalizeStrengths(await fetchPublicStrengths()));
    } catch {
      // Keep the static fallback when the API is unavailable.
    } finally {
      setStrengthsLoading(false);
    }
  };

  const loadSiteContent = async () => {
    try {
      setSiteContent(normalizeSiteContent(await fetchPublicSiteContent()));
    } catch {
      // Keep the static fallback when the API is unavailable.
    } finally {
      setSiteContentLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
    loadStrengths();
    loadSiteContent();
  }, [location.pathname, token]);

  return (
    <Ctx.Provider
      value={{
        projects,
        projectsLoading,
        reloadProjects: loadProjects,
        strengths,
        strengthsLoading,
        reloadStrengths: loadStrengths,
        siteContent,
        siteContentLoading,
        reloadSiteContent: loadSiteContent,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useContent = () => useContext(Ctx);
