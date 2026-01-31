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

import static org.mockito.BDDMockito.given;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.samples.petclinic.model.Vet;
import org.springframework.samples.petclinic.service.ClinicService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * Test class for {@link VetRestController}
 *
 * Ajustado para JUnit 5 (Jupiter) e compatibilidade com Spring Boot 3.x.
 *
 * @author Vitaliy Fedoriv
 */

@SpringBootTest
public class VetRestControllerTests {

    @Autowired
    private VetRestController vetRestController;

    @MockBean
    private ClinicService clinicService;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private List<Vet> vets;

    @BeforeEach
    public void initVets() {
        this.mockMvc = MockMvcBuilders.standaloneSetup(vetRestController)
            .setControllerAdvice(new ExceptionControllerAdvice())
            .build();

        vets = new ArrayList<>();

        Vet vet = new Vet();
        vet.setId(1);
        vet.setFirstName("James");
        vet.setLastName("Carter");
        vets.add(vet);

        vet = new Vet();
        vet.setId(2);
        vet.setFirstName("Helen");
        vet.setLastName("Leary");
        vets.add(vet);

        vet = new Vet();
        vet.setId(3);
        vet.setFirstName("Linda");
        vet.setLastName("Douglas");
        vets.add(vet);
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testGetVetSuccess() throws Exception {
        given(this.clinicService.findVetById(1)).willReturn(vets.get(0));

        this.mockMvc.perform(get("/api/vets/1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.firstName").value("James"));
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testGetVetNotFound() throws Exception {
        given(this.clinicService.findVetById(-1)).willReturn(null);

        this.mockMvc.perform(get("/api/vets/-1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testGetAllVetsSuccess() throws Exception {
        given(this.clinicService.findAllVets()).willReturn(vets);

        this.mockMvc.perform(get("/api/vets")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.[0].id").value(1))
            .andExpect(jsonPath("$.[0].firstName").value("James"))
            .andExpect(jsonPath("$.[1].id").value(2))
            .andExpect(jsonPath("$.[1].firstName").value("Helen"));
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testGetAllVetsNotFound() throws Exception {
        vets.clear();
        given(this.clinicService.findAllVets()).willReturn(vets);

        this.mockMvc.perform(get("/api/vets")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testCreateVetSuccess() throws Exception {
        Vet newVet = vets.get(0);
        newVet.setId(999);

        String newVetAsJSON = objectMapper.writeValueAsString(newVet);

        this.mockMvc.perform(post("/api/vets")
                .content(newVetAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testCreateVetError() throws Exception {
        Vet newVet = vets.get(0);
        newVet.setId(null);
        newVet.setFirstName(null);

        String newVetAsJSON = objectMapper.writeValueAsString(newVet);

        this.mockMvc.perform(post("/api/vets")
                .content(newVetAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testUpdateVetSuccess() throws Exception {
        given(this.clinicService.findVetById(1)).willReturn(vets.get(0));

        Vet newVet = vets.get(0);
        newVet.setFirstName("James");

        String newVetAsJSON = objectMapper.writeValueAsString(newVet);

        this.mockMvc.perform(put("/api/vets/1")
                .content(newVetAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk());

        this.mockMvc.perform(get("/api/vets/1")
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.firstName").value("James"));
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testUpdateVetError() throws Exception {
        Vet newVet = vets.get(0);
        newVet.setFirstName("");

        String newVetAsJSON = objectMapper.writeValueAsString(newVet);

        this.mockMvc.perform(put("/api/vets/1")
                .content(newVetAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testDeleteVetSuccess() throws Exception {
        Vet newVet = vets.get(0);
        String newVetAsJSON = objectMapper.writeValueAsString(newVet);

        given(this.clinicService.findVetById(1)).willReturn(vets.get(0));

        this.mockMvc.perform(delete("/api/vets/1")
                .content(newVetAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testDeleteVetError() throws Exception {
        Vet newVet = vets.get(0);
        String newVetAsJSON = objectMapper.writeValueAsString(newVet);

        given(this.clinicService.findVetById(-1)).willReturn(null);

        this.mockMvc.perform(delete("/api/vets/-1")
                .content(newVetAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }
}
