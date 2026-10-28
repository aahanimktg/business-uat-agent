import dotenv from 'dotenv';
dotenv.config();
export class JiraClient {

  private readonly baseUrl =process.env.JIRA_BASE_URL!;
  private readonly email =process.env.JIRA_EMAIL!;
  private readonly token =process.env.JIRA_API_TOKEN!;

  private get headers() {
    const auth =Buffer.from(`${this.email}:${this.token}`).toString('base64');
    return {
      Authorization:`Basic ${auth}`,
      Accept:'application/json'
    };
  }

  async get(endpoint: string): Promise<any> {
    const response =await fetch(`${this.baseUrl}${endpoint}`,
        {headers:this.headers});
    if (!response.ok) {throw new Error(`Jira request failed:${response.status}`);}
    return response.json();
  }
}