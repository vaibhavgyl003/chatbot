import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { BotAssistantComponent } from './bot-assistant/bot-assistant.component';

const routes: Routes = [
  {
    path:'',
    component: BotAssistantComponent
  }
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
