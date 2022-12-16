import { getProjectLanguages } from '../client/gitlab';

const calculatePrimaryProjectLanguage = async (groupToken: string, projectId: number): Promise<string | undefined> => {
  try {
    const languages = await getProjectLanguages(groupToken, projectId);

    return Object.keys(languages).sort((a, b) => languages[b] - languages[a])[0];
  } catch (err) {
    console.error(err);
    return undefined;
  }
};

export const getProjectLabels = async (projectId: number, groupToken: string, topics: string[]): Promise<string[]> => {
  const language = await calculatePrimaryProjectLanguage(groupToken, projectId);

  return [...topics, ...(language ? [`language:${language.toLocaleLowerCase()}`] : [])];
};
