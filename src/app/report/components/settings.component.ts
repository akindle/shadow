import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormControl, FormGroup } from '@angular/forms';
import { of } from 'rxjs';

import { BuffId } from 'src/app/logs/models/buff-id.enum';
import { ParamsService } from 'src/app/params.service';
import { SettingsService } from 'src/app/settings.service';
import { ActivatedRoute, Router } from '@angular/router';
import { ISettings, Settings } from 'src/app/settings';
import { switchMap, withLatestFrom } from 'rxjs/operators';
import { LogSummary } from 'src/app/logs/models/log-summary';
import { Actor } from 'src/app/logs/models/actor';
import { CombatantInfo } from 'src/app/logs/models/combatant-info';
import { LogsService } from 'src/app/logs/logs.service';

@Component({
  selector: 'report-settings',
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SettingsComponent implements OnInit {
  log: LogSummary;
  logId: string;
  encounterId: number;
  playerId: string;
  playerInfo: CombatantInfo|null;
  actor: Actor;
  logHasteRating: number|null;
  settings: Settings;
  form: FormGroup<ISettingsForm>;

  constructor(private logs: LogsService,
              private router: Router,
              private route: ActivatedRoute,
              private params: ParamsService,
              private settingsSvc: SettingsService) {}

  ngOnInit() {
    this.route.paramMap.pipe(
      withLatestFrom(this.route.parent!.paramMap),
      switchMap(([params, parentParams]) => {
        this.logId = parentParams.get('logId') as string;
        this.playerId = params.get('player') as string;

        if (params.has('encounterId')) {
          this.encounterId = parseInt(params.get('encounterId') as string, 10);
        }

        return this.logs.getSummary(this.logId);
      }),
      switchMap((log: LogSummary) => {
        this.log = log;
        this.actor = this.log.getActorByRouteId(this.playerId) as Actor;

        if (this.encounterId) {
          return this.logs.getPlayerInfo(log, this.actor, this.encounterId);
        } else {
          return of(null)
        }
      })
    ).subscribe((playerInfo: CombatantInfo|null) => {
      this.playerInfo = playerInfo;
      this.settings = this.settingsSvc.get(this.playerId);
      this.logHasteRating = playerInfo?.stats?.hasteRating || this.settings.hasteRating || null;

      this.form = new FormGroup<ISettingsForm>({
        hasteRating: new FormControl(this.logHasteRating),
        improvedMindBlast: new FormControl(this.settings.improvedMindBlast, { nonNullable: true }),
        improvedMoonkinAura: new FormControl(this.settings.improvedMoonkinAura, { nonNullable: true }),
        improvedRetAura: new FormControl(this.settings.improvedRetAura, { nonNullable: true }),
        wrathOfAir: new FormControl(this.settings.wrathOfAir, { nonNullable: true }),
        moonkinAura: new FormControl(this.auraState(BuffId.MOONKIN_AURA), { nonNullable: true })
      });

      if (playerInfo?.initFromLog) {
        this.form.controls.hasteRating.disable();
        this.form.controls.moonkinAura.disable();
      }
    });
  }

  cancel(event: Event) {
    event.preventDefault();
    this.exitSettings();
  }

  apply(event: Event) {
    event.preventDefault();

    const settings = new Settings(this.form.value as ISettings);

    // form.value excludes disabled controls. That's annoying.
    settings.hasteRating = this.form.controls.hasteRating.value;

    if (!this.playerInfo?.initFromLog) {
      if (this.form.controls.moonkinAura.value) {
        settings.auras.push(BuffId.MOONKIN_AURA);
      }
    }

    this.settingsSvc.update(this.playerId, settings);
    this.exitSettings();
  }

  private exitSettings() {
    this.router.navigate(['/report', this.logId, this.playerId, this.encounterId], {
      queryParams: this.params.forNavigation()
    });
  }


  private auraState(id: BuffId) {
    if (this.playerInfo?.initFromLog) {
      return this.playerInfo.haveAura(id);
    }

    return this.settings.haveAura(id);
  }
}

interface ISettingsForm {
  hasteRating: FormControl<number|null>;
  improvedMindBlast: FormControl<number>;
  improvedMoonkinAura: FormControl<boolean>;
  improvedRetAura: FormControl<boolean>;
  wrathOfAir: FormControl<boolean>;
  moonkinAura: FormControl<boolean>;
}