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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.ArrayList;
import java.util.List;

import com.fasterxml.jackson.databind.ObjectMapper;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.samples.petclinic.model.PetType;
import org.springframework.samples.petclinic.service.ClinicService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

/**
 * Test class for {@link PetTypeRestController}
 *
 * Observação: Ajustado para JUnit 5 (Jupiter) e compatibilidade com Spring Boot 3.x.
 *
 * @author Vitaliy Fedoriv
 */
 
@SpringBootTest
public class PetTypeRestControllerTests {

    @Autowired
    private PetTypeRestController petTypeRestController;

    @MockBean
    private ClinicService clinicService;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private List<PetType> petTypes;

    @BeforeEach
    public void initPetTypes() {
        this.mockMvc = MockMvcBuilders.standaloneSetup(petTypeRestController)
            .setControllerAdvice(new ExceptionControllerAdvice())
            .build();

        petTypes = new ArrayList<>();

        PetType petType = new PetType();
        petType.setId(1);
        petType.setName("cat");
        petTypes.add(petType);

        petType = new PetType();
        petType.setId(2);
        petType.setName("dog");
        petTypes.add(petType);

        petType = new PetType();
        petType.setId(3);
        petType.setName("lizard");
        petTypes.add(petType);

        petType = new PetType();
        petType.setId(4);
        petType.setName("snake");
        petTypes.add(petType);
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetPetTypeSuccessAsOwnerAdmin() throws Exception {
        given(this.clinicService.findPetTypeById(1)).willReturn(petTypes.get(0));

        this.mockMvc.perform(get("/api/pettypes/1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("cat"));
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testGetPetTypeSuccessAsVetAdmin() throws Exception {
        given(this.clinicService.findPetTypeById(1)).willReturn(petTypes.get(0));

        this.mockMvc.perform(get("/api/pettypes/1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.name").value("cat"));
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetPetTypeNotFound() throws Exception {
        given(this.clinicService.findPetTypeById(-1)).willReturn(null);

        this.mockMvc.perform(get("/api/pettypes/-1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetAllPetTypesSuccessAsOwnerAdmin() throws Exception {
        // Mantém apenas id 2 e 4
        petTypes.remove(0); // remove id 1
        petTypes.remove(1); // remove id 3 (após remoção acima)
        given(this.clinicService.findAllPetTypes()).willReturn(petTypes);

        this.mockMvc.perform(get("/api/pettypes")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.[0].id").value(2))
            .andExpect(jsonPath("$.[0].name").value("dog"))
            .andExpect(jsonPath("$.[1].id").value(4))
            .andExpect(jsonPath("$.[1].name").value("snake"));
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testGetAllPetTypesSuccessAsVetAdmin() throws Exception {
        // Mantém apenas id 2 e 4
        petTypes.remove(0);
        petTypes.remove(1);
        given(this.clinicService.findAllPetTypes()).willReturn(petTypes);

        this.mockMvc.perform(get("/api/pettypes")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.[0].id").value(2))
            .andExpect(jsonPath("$.[0].name").value("dog"))
            .andExpect(jsonPath("$.[1].id").value(4))
            .andExpect(jsonPath("$.[1].name").value("snake"));
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testGetAllPetTypesNotFound() throws Exception {
        petTypes.clear();
        given(this.clinicService.findAllPetTypes()).willReturn(petTypes);

        this.mockMvc.perform(get("/api/pettypes")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testCreatePetTypeSuccess() throws Exception {
        PetType newPetType = petTypes.get(0);
        newPetType.setId(999);

        String newPetTypeAsJSON = objectMapper.writeValueAsString(newPetType);

        this.mockMvc.perform(post("/api/pettypes")
                .content(newPetTypeAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testCreatePetTypeError() throws Exception {
        PetType newPetType = petTypes.get(0);
        newPetType.setId(null);
        newPetType.setName(null);

        String newPetTypeAsJSON = objectMapper.writeValueAsString(newPetType);

        this.mockMvc.perform(post("/api/pettypes")
                .content(newPetTypeAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testUpdatePetTypeSuccess() throws Exception {
        given(this.clinicService.findPetTypeById(2)).willReturn(petTypes.get(1));

        PetType newPetType = petTypes.get(1);
        newPetType.setName("dog I");

        String newPetTypeAsJSON = objectMapper.writeValueAsString(newPetType);

        this.mockMvc.perform(put("/api/pettypes/2")
                .content(newPetTypeAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        this.mockMvc.perform(get("/api/pettypes/2")
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(2))
            .andExpect(jsonPath("$.name").value("dog I"));
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testUpdatePetTypeError() throws Exception {
        PetType newPetType = petTypes.get(0);
        newPetType.setName("");

        String newPetTypeAsJSON = objectMapper.writeValueAsString(newPetType);

        this.mockMvc.perform(put("/api/pettypes/1")
                .content(newPetTypeAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testDeletePetTypeSuccess() throws Exception {
        PetType newPetType = petTypes.get(0);
        String newPetTypeAsJSON = objectMapper.writeValueAsString(newPetType);

        given(this.clinicService.findPetTypeById(1)).willReturn(petTypes.get(0));

        this.mockMvc.perform(delete("/api/pettypes/1")
                .content(newPetTypeAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "VET_ADMIN")
    public void testDeletePetTypeError() throws Exception {
        PetType newPetType = petTypes.get(0);
        String newPetTypeAsJSON = objectMapper.writeValueAsString(newPetType);

        given(this.clinicService.findPetTypeById(-1)).willReturn(null);

        this.mockMvc.perform(delete("/api/pettypes/-1")
                .content(newPetTypeAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }
}

