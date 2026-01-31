/*
 * Copyright 2016-2017 the original author or authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

package org.springframework.samples.petclinic.rest;

import java.util.ArrayList;
import java.util.Collection;

import org.springframework.transaction.annotation.Transactional;
import jakarta.validation.Valid;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.samples.petclinic.model.Visit;
import org.springframework.samples.petclinic.service.ClinicService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.BindingResult;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.util.UriComponentsBuilder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@CrossOrigin(exposedHeaders = { "errors", "content-type" })
@RequestMapping("/api/visits")
public class VisitRestController {

    @Autowired
    private ClinicService clinicService;

    @PreAuthorize("hasRole('OWNER_ADMIN')")
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Collection<Visit>> getAllVisits() {
        Collection<Visit> visits = new ArrayList<>();
        visits.addAll(this.clinicService.findAllVisits());
        if (visits.isEmpty()) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(visits, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('OWNER_ADMIN')")
    @GetMapping(value = "/{visitId}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Visit> getVisit(@PathVariable("visitId") int visitId) {
        Visit visit = this.clinicService.findVisitById(visitId);
        if (visit == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        return new ResponseEntity<>(visit, HttpStatus.OK);
    }

    @PreAuthorize("hasRole('OWNER_ADMIN')")
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Visit> addVisit(@RequestBody @Valid Visit visit,
                                          BindingResult bindingResult,
                                          UriComponentsBuilder ucBuilder) {
        BindingErrorsResponse errors = new BindingErrorsResponse();
        HttpHeaders headers = new HttpHeaders();

        if (bindingResult.hasErrors() || visit == null || visit.getPet() == null) {
            errors.addAllErrors(bindingResult);
            headers.add("errors", errors.toJSON());
            return new ResponseEntity<>(headers, HttpStatus.BAD_REQUEST);
        }

        this.clinicService.saveVisit(visit);
        headers.setLocation(ucBuilder.path("/api/visits/{id}").buildAndExpand(visit.getId()).toUri());
        return new ResponseEntity<>(visit, headers, HttpStatus.CREATED);
    }

    @PreAuthorize("hasRole('OWNER_ADMIN')")
    @PutMapping(value = "/{visitId}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<Void> updateVisit(@PathVariable("visitId") int visitId,
                                            @RequestBody @Valid Visit visit,
                                            BindingResult bindingResult) {
        BindingErrorsResponse errors = new BindingErrorsResponse();
        HttpHeaders headers = new HttpHeaders();

        if (bindingResult.hasErrors() || visit == null || visit.getPet() == null) {
            errors.addAllErrors(bindingResult);
            headers.add("errors", errors.toJSON());
            return new ResponseEntity<>(headers, HttpStatus.BAD_REQUEST);
        }

        Visit currentVisit = this.clinicService.findVisitById(visitId);
        if (currentVisit == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }

        currentVisit.setDate(visit.getDate());
        currentVisit.setDescription(visit.getDescription());
        currentVisit.setPet(visit.getPet());
        this.clinicService.saveVisit(currentVisit);

        // 204 No Content — sem body e sem content-type
        return ResponseEntity.noContent().build();
    }

    @PreAuthorize("hasRole('OWNER_ADMIN')")
    @DeleteMapping(value = "/{visitId}")
    @Transactional
    public ResponseEntity<Void> deleteVisit(@PathVariable("visitId") int visitId) {
        Visit visit = this.clinicService.findVisitById(visitId);
        if (visit == null) {
            return new ResponseEntity<>(HttpStatus.NOT_FOUND);
        }
        this.clinicService.deleteVisit(visit);
        return new ResponseEntity<>(HttpStatus.NO_CONTENT);
    }
}
