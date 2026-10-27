import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { WorkspaceStore } from '../core/workspace.store';
import { SecretaryHome } from './secretary-home';
import { ProfessionalHome } from './professional-home';
@Component({standalone:true,changeDetection:ChangeDetectionStrategy.Eager,imports:[SecretaryHome,ProfessionalHome],template:`@if(s.role()==='secretaria'){<app-secretary-home />}@else{<app-professional-home />}`})
export class Dashboard {readonly s=inject(WorkspaceStore);}
