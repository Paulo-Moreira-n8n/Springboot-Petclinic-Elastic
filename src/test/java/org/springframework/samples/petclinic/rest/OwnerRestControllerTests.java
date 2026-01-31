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
import org.springframework.samples.petclinic.model.Owner;
import org.springframework.samples.petclinic.service.ClinicService;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

@SpringBootTest
public class OwnerRestControllerTests {

    @Autowired
    private OwnerRestController ownerRestController;

    @MockBean
    private ClinicService clinicService;

    @Autowired
    private ObjectMapper objectMapper;

    private MockMvc mockMvc;

    private List<Owner> owners;

    @BeforeEach
    public void initOwners() {
        this.mockMvc = MockMvcBuilders.standaloneSetup(ownerRestController)
            .setControllerAdvice(new ExceptionControllerAdvice())
            .build();

        owners = new ArrayList<>();

        Owner owner = new Owner();
        owner.setId(1);
        owner.setFirstName("George");
        owner.setLastName("Franklin");
        owner.setAddress("110 W. Liberty St.");
        owner.setCity("Madison");
        owner.setZipCode("53701");
        owner.setState("Wisconsin");
        owner.setTelephone("6085551023");
        owners.add(owner);

        owner = new Owner();
        owner.setId(2);
        owner.setFirstName("Betty");
        owner.setLastName("Davis");
        owner.setAddress("638 Cardinal Ave.");
        owner.setCity("Sun Prairie");
        owner.setTelephone("6085551749");
        owner.setZipCode("53590");
        owner.setState("Wisconsin");
        owners.add(owner);

        owner = new Owner();
        owner.setId(3);
        owner.setFirstName("Eduardo");
        owner.setLastName("Rodriquez");
        owner.setAddress("2693 Commerce St.");
        owner.setCity("McFarland");
        owner.setTelephone("6085558763");
        owner.setZipCode("53558");
        owner.setState("Wisconsin");
        owners.add(owner);

        owner = new Owner();
        owner.setId(4);
        owner.setFirstName("Harold");
        owner.setLastName("Davis");
        owner.setAddress("563 Friendly St.");
        owner.setCity("Windsor");
        owner.setTelephone("6085553198");
        owner.setZipCode("53598");
        owner.setState("Wisconsin");
        owners.add(owner);
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetOwnerSuccess() throws Exception {
        given(this.clinicService.findOwnerById(1)).willReturn(owners.get(0));

        this.mockMvc.perform(get("/api/owners/1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.firstName").value("George"));
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetOwnerNotFound() throws Exception {
        given(this.clinicService.findOwnerById(-1)).willReturn(null);

        this.mockMvc.perform(get("/api/owners/-1")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetOwnersListSuccess() throws Exception {
        // Mantém apenas os com sobrenome "Davis": id 2 e 4
        owners.remove(0); // remove id 1
        owners.remove(1); // remove id 3 (após remoção acima)
        given(this.clinicService.findOwnerByLastName("Davis")).willReturn(owners);

        this.mockMvc.perform(get("/api/owners/lastname/Davis")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.[0].id").value(2))
            .andExpect(jsonPath("$.[0].firstName").value("Betty"))
            .andExpect(jsonPath("$.[1].id").value(4))
            .andExpect(jsonPath("$.[1].firstName").value("Harold"));
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetOwnersListNotFound() throws Exception {
        owners.clear();
        given(this.clinicService.findOwnerByLastName("NoSuchLastName")).willReturn(owners);

        this.mockMvc.perform(get("/api/owners/lastname/NoSuchLastName")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetAllOwnersSuccess() throws Exception {
        // Mantém apenas id 2 e 4
        owners.remove(0);
        owners.remove(1);
        given(this.clinicService.findAllOwners()).willReturn(owners);

        this.mockMvc.perform(get("/api/owners")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.[0].id").value(2))
            .andExpect(jsonPath("$.[0].firstName").value("Betty"))
            .andExpect(jsonPath("$.[1].id").value(4))
            .andExpect(jsonPath("$.[1].firstName").value("Harold"));
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testGetAllOwnersNotFound() throws Exception {
        owners.clear();
        given(this.clinicService.findAllOwners()).willReturn(owners);

        this.mockMvc.perform(get("/api/owners")
                .accept(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testCreateOwnerSuccess() throws Exception {
        Owner newOwner = owners.get(0);
        newOwner.setId(999);

        String newOwnerAsJSON = objectMapper.writeValueAsString(newOwner);

        this.mockMvc.perform(post("/api/owners")
                .content(newOwnerAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isCreated());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testCreateOwnerError() throws Exception {
        Owner newOwner = owners.get(0);
        newOwner.setId(null);
        newOwner.setFirstName(null);

        String newOwnerAsJSON = objectMapper.writeValueAsString(newOwner);

        this.mockMvc.perform(post("/api/owners")
                .content(newOwnerAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testUpdateOwnerSuccess() throws Exception {
        given(this.clinicService.findOwnerById(1)).willReturn(owners.get(0));

        Owner newOwner = owners.get(0);
        newOwner.setFirstName("George I");

        String newOwnerAsJSON = objectMapper.writeValueAsString(newOwner);

        this.mockMvc.perform(put("/api/owners/1")
                .content(newOwnerAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());

        this.mockMvc.perform(get("/api/owners/1")
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isOk())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_JSON))
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.firstName").value("George I"));
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testUpdateOwnerError() throws Exception {
        Owner newOwner = owners.get(0);
        newOwner.setFirstName("");

        String newOwnerAsJSON = objectMapper.writeValueAsString(newOwner);

        this.mockMvc.perform(put("/api/owners/1")
                .content(newOwnerAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isBadRequest());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testDeleteOwnerSuccess() throws Exception {
        Owner newOwner = owners.get(0);
        String newOwnerAsJSON = objectMapper.writeValueAsString(newOwner);

        given(this.clinicService.findOwnerById(1)).willReturn(owners.get(0));

        this.mockMvc.perform(delete("/api/owners/1")
                .content(newOwnerAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(roles = "OWNER_ADMIN")
    public void testDeleteOwnerError() throws Exception {
        Owner newOwner = owners.get(0);
        String newOwnerAsJSON = objectMapper.writeValueAsString(newOwner);

        given(this.clinicService.findOwnerById(-1)).willReturn(null);

        this.mockMvc.perform(delete("/api/owners/-1")
                .content(newOwnerAsJSON)
                .accept(MediaType.APPLICATION_JSON)
                .contentType(MediaType.APPLICATION_JSON))
            .andExpect(status().isNotFound());
    }
}
