import dotenv from 'dotenv';
import {AIProvider} from '../providers/AIProvider';
import {StructuredResponseService} from '../services/structured-response.service';
import {PlannerService} from '../services/planner.service';
import {Requirement} from '../../domain/schemas/requirement.schema';

dotenv.config();

async function main(): Promise<void> {

  const requirement: Requirement = {

    storyId:'FLIGHT-SEARCH-001',
    title:'Flight Search',
    description:'Validate flight search functionality for business UAT.',
    acceptanceCriteria: [
      {id: 'AC1',
       description:'User should be able to select valid origin and destination airports or cities from the available options.'
      },
      {
        id: 'AC2',
        description:'User should be able to select a valid departure date. Past dates should not be allowed for a new flight search.'
      },
      {
        id: 'AC3',
        description:'User should be able to select the number of passengers and available cabin class before initiating the search.'
      },
      {
        id: 'AC4',
        description:'On providing all mandatory search details and selecting Search Flights, the system should display available flights matching the selected route and travel date.'
      },
      {
        id: 'AC5',
        description:'If the user initiates a search without providing mandatory information, the system should prevent the search and display appropriate validation messages.'
      }
    ]
  };


  const provider =new AIProvider();
  const parser =new StructuredResponseService();
  const planner =new PlannerService(provider,parser);
  try {
    const result =await planner.createPlan(requirement);
    console.log('\n====================================');
    console.log('UAT ORCHESTRATION COMPLETED');
    console.log('====================================\n');
    console.log( JSON.stringify(result,null,2));
  } catch (error) {
    console.error('\n[ORCHESTRATOR] FAILED');
    // if ( error instanceof Error) {
    //   console.error(error.message);
    // } else {console.error(error);}
    process.exitCode = 1;
  }

}


main();